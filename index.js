const fs = require('fs');

async function compress(srcFolder, zipFilePath) {
  const archiver = require('archiver');
  const path = require('path')

  const targetBasePath = path.dirname(zipFilePath);

  if (targetBasePath === srcFolder) {
    throw new Error('Source and target folder must be different.');
  }
  try {
    await fs.promises.access(srcFolder, fs.constants.R_OK | fs.constants.W_OK);
    await fs.promises.access(targetBasePath, fs.constants.R_OK | fs.constants.W_OK);
  } catch (e) {
    throw new Error(`Permission error: ${e.message}`);
  }

  const output = fs.createWriteStream(zipFilePath);
  const zipArchive = archiver('zip', { store: true });

  return new Promise((resolve, reject) => {
    output.on('close', resolve);
    output.on('error', (err) => {
      reject(err);
    });

    zipArchive.pipe(output);
    zipArchive.directory(srcFolder, false);
    zipArchive.finalize();
  });
}

async function runAction() {
  const got = require('got')

  const FormData = require('form-data');
  const core = require('@actions/core');
  const github = require('@actions/github');

  // http://username:password@example.com/  
  const allureServerUrl = new URL(core.getInput('allure-server-url', { required: true }));
  // getInput returns empty string in case no input passed, which is fine for us
  allureServerUrl.username = core.getInput('username')
  allureServerUrl.password = core.getInput('password')

  await compress(core.getInput('allure-results', { required: true }), './allure-results.zip')
  core.info(`Created compressed ./allure-results.zip`)

  const defaultGot = got.extend({
    prefixUrl: allureServerUrl,
    responseType: 'json'
  });

  const form = new FormData();
  form.append('allureResults', fs.createReadStream('./allure-results.zip'));
  const resultsResp = await defaultGot('api/result', {
    method: 'POST',
    body: form,
  })

  core.info(`Upload done: `, resultsResp.body)

  const results_id = resultsResp.body.uuid
  const inputPath = core.getInput('path', { required: true })
  const path = inputPath == 'DEFAULT_PATH' ? github.context.repo.repo : inputPath
  const reportUrl = await defaultGot('api/report', {
    method: 'POST',
    json: {
      reportSpec: {
        path: [
          path
        ]
      },
      results: [
        results_id
      ],
      deleteResults: true
    }
  })

  core.info(`Report generation done: `, reportUrl.body)

  core.info(`========================================================================`)
  core.info(`REPORT URL: `, reportUrl.body.url)
  core.info(`========================================================================`)

  core.setOutput("report-url", reportUrl.body.url)
}

runAction().catch(err => {
  core.error(err.message)
  core.setFailed(err.message);
})
