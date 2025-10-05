import bodyParser from "body-parser";
import express, { Express } from "express";

import bullBoardAdapter from "./config/bullBoardConfig";
import serverConfig from "./config/serverConfig";
// import submissionQueueProducer from './producers/submissionQueueProducer';
import apiRouter from "./routes";
import { submission_queue } from "./utils/constants";
import SubmissionWorker from "./workers/SubmissionWorker";

const app: Express = express();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text({ type: "*/*" }));

// Routes
app.use('/api', apiRouter);
app.use('/ui', bullBoardAdapter.getRouter());

// Start server
app.listen(serverConfig.PORT, () => {
  console.log(`Server started at *:${serverConfig.PORT}`);
  console.log(`BullBoard dashboard running on: http://localhost:${serverConfig.PORT}/ui`);

  // Start the submission worker
  SubmissionWorker(submission_queue);

  // Example Java code submission
  //   const javaCode = `
  // import java.util.Scanner;

  // public class Main {
  //     public static void main(String[] args) {
  //         Scanner sc = new Scanner(System.in);
  //         int n = sc.nextInt();
  //         System.out.println(n * n); // prints square of input
  //     }
  // }
  //   `;

  // const inputCase = `5`;
  // const outputCase = `25`;

  // submissionQueueProducer({
  //   "1234": {
  //     language: "JAVA",
  //     inputCase,
  //     outputCase,
  //     code: javaCode
  //   }
  // });
});
