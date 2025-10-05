import bodyParser from "body-parser";
import express, { Express } from "express";

import bullBoardAdapter from "./config/bullBoardConfig";
import serverConfig from "./config/serverConfig";
import JavaExecutor from "./containers/javaExecutor";
// import runCpp from "./containers/runCpp";
import submissionQueueProducer from "./producers/submissionQueueProducer";
import apiRouter from "./routes";
import { submission_queue } from "./utils/constants";
// import SampleWorker from "./workers/SampleWorker";
import SubmissionWorker from "./workers/SubmissionWorker";
const app: Express = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.text());

app.use("/api", apiRouter);
app.use("/ui", bullBoardAdapter.getRouter());

app.listen(serverConfig.PORT, () => {
  console.log(`Server started at *:${serverConfig.PORT}`);
  console.log(
    `BullBoard dashboard running on: http://localhost:${serverConfig.PORT}/ui`
  );

  // SampleWorker('SampleQueue');
  SubmissionWorker(submission_queue);

  const userCode = `

      class Solution {
        public:
        vector<int> permute() {
            vector<int> v;
            v.push_back(10);
            return v;
        }
      };
    `;

  const code = `
    #include<iostream>
    #include<vector>
    #include<stdio.h>
    using namespace std;

    ${userCode}

    int main() {

      Solution s;
      vector<int> result = s.permute();
      for(int x : result) {
        cout<<x<<" ";
      }
      cout<<endl;
      return 0;
    }
    `;

  const inputCase = `10
  `;

  submissionQueueProducer({
    "1234": {
      language: "CPP",
      inputCase,
      code,
    },
  });
  const javaCode = `
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scn = new Scanner(System.in);

        System.out.print("Enter a number: ");
        int input = scn.nextInt();
        System.out.flush();

        for (int i = 90; i < input; i++) {
            System.out.println(i);
        }

        scn.close();
    }
}

  
  `;
  // runJava(javaCode, inputCase);
  const javaExecutor = new JavaExecutor(); // ✅ instantiate class
  const javaInputCase = `10`;
  javaExecutor
    .execute(javaCode, javaInputCase, "expectedOutputHere")
    .then((result) => console.log(result))
    .catch((err) => console.error(err));
  // runCpp(code, inputCase);
});
