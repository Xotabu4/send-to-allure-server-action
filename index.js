const core = require('@actions/core');
const github = require('@actions/github');

async function runAction() {
  const got = require('got')
  const fs = require('fs');
  const FormData = require('form-data');

  // http://username:password@example.com/

  const baseUrl = new URL(core.getInput('allure-server-url'));

  if (!baseUrl) throw 
  const baseUrl = new URL(`http://93.126.97.71:5001`)

  const baseGot = got.extend({
    prefixUrl: baseUrl,
    responseType: 'json'
  });

  const form = new FormData();
  form.append('allureResults', fs.createReadStream('./allure-results.zip'));
  const resultsResp = await baseGot('api/result', {
    method: 'POST',
    body: form,
  })

  console.log(`Upload done: `, resultsResp.body)

  const results_id = resultsResp.body.uuid
  const reportUrl = await baseGot('api/report', {
    method: 'POST',
    json: {
      "reportSpec": {
        "path": [
          "pet-store-tests-READY"
        ]
      },
      "results": [
        results_id
      ],
      "deleteResults": true
    }
  })
  console.log(`Report generation done: `, reportUrl.body)

  console.log(`========================================================================`)
  console.log(`REPORT URL: `, reportUrl.body.url)
  console.log(`========================================================================`)
}

uploadAndGenerate().catch(err => {
  core.setFailed(error.message);
})


// try {
//   // `who-to-greet` input defined in action metadata file
//   const nameToGreet = core.getInput('who-to-greet');
//   console.log(`Hello ${nameToGreet}!`);
//   const time = (new Date()).toTimeString();
//   core.setOutput("time", time);
//   // Get the JSON webhook payload for the event that triggered the workflow
//   const payload = JSON.stringify(github.context.payload, undefined, 2)
//   console.log(`The event payload: ${payload}`);
// } catch (error) {
//   core.setFailed(error.message);
// }