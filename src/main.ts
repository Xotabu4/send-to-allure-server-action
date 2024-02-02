import { error, getInput, info, setFailed, setOutput } from "@actions/core";
import archiver from "archiver";
import path from "path";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

async function compress(srcFolder: string, zipFilePath: string): Promise<void> {
  const targetBasePath = path.dirname(zipFilePath);

  if (targetBasePath === srcFolder) {
    throw new Error("Source and target folder must be different.");
  }
  try {
    await fs.promises.access(srcFolder, fs.constants.R_OK | fs.constants.W_OK);
    await fs.promises.access(
      targetBasePath,
      fs.constants.R_OK | fs.constants.W_OK,
    );
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`Permission error: ${e.message}`);
    }
  }

  const output = fs.createWriteStream(zipFilePath);
  const zipArchive = archiver("zip");

  return new Promise((resolve, reject) => {
    output.on("close", resolve);
    output.on("error", (err) => {
      reject(err);
    });

    zipArchive.pipe(output);
    zipArchive.directory(srcFolder, false);
    zipArchive.finalize();
  });
}

async function runAction() {
  // http://username:password@example.com/
  const allureServerUrl = new URL(
    getInput("allure-server-url", { required: true }),
  );
  // getInput returns empty string in case no input passed, which is fine for us
  allureServerUrl.username = getInput("username");
  allureServerUrl.password = getInput("password");

  await compress(
    getInput("allure-results", { required: true }),
    "./allure-results.zip",
  );
  info(`Created compressed ./allure-results.zip`);

  const api = axios.create({
    baseURL: allureServerUrl.toString(),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const form = new FormData();
  info(`Uploading compressed ./allure-results.zip`);
  form.append("allureResults", fs.createReadStream("allure-results.zip"));
  const { data: uploadResult } = await api.post<UploadResult>(
    "api/result",
    form,
    {
      headers: form.getHeaders(),
    },
  );

  info(`Upload done`);

  const results_id = uploadResult.uuid;
  const inputPath = getInput("path", { required: true });
  info(`Triggering report generation for ${inputPath}`);
  const { data: generateReport } = await api.post<GenerateReport>(
    "api/report",
    {
      reportSpec: {
        path: [inputPath],
        executorInfo: {
          reportName: "Generated",
          name: "GitHub",
          type: "github",
          buildUrl: getInput("build-url"),
          buildName: getInput("build-name"),
        },
      },
      results: [results_id],
      deleteResults: true,
    },
  );

  info("Report generation done");

  info(
    "========================================================================",
  );
  info(`REPORT URL: ${generateReport.url}`);
  info(
    "========================================================================",
  );

  setOutput("report-url", generateReport.url);
}

runAction().catch((err) => {
  error(err.message);
  setFailed(err.message);
});
