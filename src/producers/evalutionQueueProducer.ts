import evaluationQueue from "../queues/evaluationQueue";
import { ExecutionResponse } from "../types/CodeExecutorStrategy";

interface EvaluationJobData {
  response: ExecutionResponse;
  userId?: string;
  submissionId: string;
}

export default async function (payload: EvaluationJobData) {
  await evaluationQueue.add("EvaluationJob", payload);
  console.log("Successfully added a new evalution queue ");
}
