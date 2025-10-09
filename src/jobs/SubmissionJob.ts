import { Job } from "bullmq";

import evalutionQueueProducer from "../producers/evalutionQueueProducer";
import { IJob } from "../types/bullMqJobDefinition";
import { ExecutionResponse } from "../types/CodeExecutorStrategy";
import { SubmissionPayload } from "../types/submissionPayload";
import createExecutor from "../utils/ExecutorFactory";
import serverConfig from "../config/serverConfig";
const SUBMISSION_SERVICE_UPDATE =
  serverConfig.SUBMISSION_SERVICE + "/submissions";
export default class SubmissionJob implements IJob {
  name: string;
  payload: Record<string, SubmissionPayload>;
  constructor(payload: Record<string, SubmissionPayload>) {
    this.payload = payload;
    this.name = this.constructor.name;
  }

  handle = async (job?: Job) => {
    console.log("Handler of the job called");
    // console.log(this.payload);
    if (job) {
      const key = Object.keys(this.payload)[0];
      const codeLanguage = this.payload[key].language;
      const code = this.payload[key].code;
      const inputTestCase = this.payload[key].inputCase;
      const outputTestCase = this.payload[key].outputCase;
      const userId = this.payload?.[key]?.userId;
      const submissionId = this.payload?.[key]?.submissionId;

      const strategy = createExecutor(codeLanguage);
      // console.log(strategy);
      if (strategy != null) {
        const response: ExecutionResponse = await strategy.execute(
          code,
          inputTestCase,
          outputTestCase
        );
        if (
          response.status === "COMPLETED" ||
          response.status === "FAILED_TEST"
        ) {
          console.log("Code executed successfully");

          await fetch(SUBMISSION_SERVICE_UPDATE, {
            method: "PUT", // or POST if your route uses POST
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({ submissionId, status: response.status }),
          });
          await evalutionQueueProducer({
            response,
            userId,
            submissionId,
          });
        } else {
          console.log("Something went wrong with code execution");
          console.log(response);
        }
      }
    }
  };

  failed = (job?: Job): void => {
    console.log("Job failed");
    if (job) {
      console.log(job.id);
    }
  };
}
