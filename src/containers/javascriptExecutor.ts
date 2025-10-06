import Docker from "dockerode";

import CodeExecutorStrategy, { ExecutionResponse } from "../types/CodeExecutorStrategy";
import { NODE_IMAGE } from "../utils/constants"; // e.g., "node:18-slim"
import createContainer from "./containerFactory";
import decodeDockerStream from "./dockerHelper";
import pullImage from "./pullImage";

class JavaScriptExecutor implements CodeExecutorStrategy {
  async execute(
    code: string,
    inputTestCase: string,
    outputTestCase: string
  ): Promise<ExecutionResponse> {
    console.log("Code to execute:", code);
    console.log("Input:", inputTestCase);
    console.log("Expected Output:", outputTestCase);

    await pullImage(NODE_IMAGE);
    console.log("Initializing a new Node Docker container");

    // Prepare the command to run JavaScript code with input
    const runCommand = `
cat << 'EOF' > script.js
${code}
EOF
echo '${inputTestCase}' | node script.js
`;

    const nodeDockerContainer: Docker.Container = await createContainer(NODE_IMAGE, [
      "/bin/sh",
      "-c",
      runCommand,
    ]);

    try {
      await nodeDockerContainer.start();
      console.log("Docker container started");

      await nodeDockerContainer.wait();

      const logs = await nodeDockerContainer.logs({
        stdout: true,
        stderr: true,
      });

      const rawLogBuffer: Buffer[] = Array.isArray(logs) ? (logs as Buffer[]) : [logs as Buffer];
      const completeBuffer = Buffer.concat(rawLogBuffer);
      const decoded = decodeDockerStream(completeBuffer);

      if (decoded.stderr) {
        return { output: decoded.stderr.trim(), status: "ERROR" };
      }

      return { output: decoded.stdout.trim(), status: "COMPLETED" };
    } catch (error: unknown) {
      return { output: String(error), status: "ERROR" };
    } finally {
      await nodeDockerContainer.remove();
    }
  }
}

export default JavaScriptExecutor;
