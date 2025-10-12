import Docker from "dockerode";
import CodeExecutorStrategy, { ExecutionResponse } from "../types/CodeExecutorStrategy";
import { NODE_IMAGE } from "../utils/constants";
import createContainer from "./containerFactory";
import decodeDockerStream from "./dockerHelper";
import pullImage from "./pullImage";

class JavaScriptExecutor implements CodeExecutorStrategy {
  async execute(
    code: string,
    inputTestCase: string,
    outputTestCase: string
  ): Promise<ExecutionResponse> {
    await pullImage(NODE_IMAGE);

    const runCommand = `
cat << 'EOF' > script.js
${code}
EOF
echo '${inputTestCase}' | node script.js
`;

    const nodeDockerContainer: Docker.Container = await createContainer(
      NODE_IMAGE,
      ["/bin/sh", "-c", runCommand]
    );

    try {
      await nodeDockerContainer.start();
      await nodeDockerContainer.wait();

      const logs = await nodeDockerContainer.logs({ stdout: true, stderr: true });
      const rawLogBuffer: Buffer[] = Array.isArray(logs) ? (logs as Buffer[]) : [logs as Buffer];
      const completeBuffer = Buffer.concat(rawLogBuffer);
      const decoded = decodeDockerStream(completeBuffer);

      const stdout = decoded.stdout.trim();
      const stderr = decoded.stderr.trim();

      // 🔍 Case 1: Compilation or runtime error
      if (stderr) {
        return {
          output: stderr,
          status: "COMPILATION_ERROR",
        };
      }

      // 🔍 Case 2: Successful execution but wrong output
      if (stdout !== outputTestCase) {
        return {
          output: stdout,
          status: "FAILED_TEST",
        };
      }

      // 🔍 Case 3: Perfect match
      return {
        output: stdout,
        status: "SUCCESS",
      };
    } catch (error: unknown) {
      // 🔥 Docker / internal failure
      return {
        output: String(error),
        status: "SYSTEM_ERROR",
      };
    } finally {
      try {
        await nodeDockerContainer.remove();
      } catch (err) {
        console.warn("Failed to remove container:", err);
      }
    }
  }
}

export default JavaScriptExecutor;
