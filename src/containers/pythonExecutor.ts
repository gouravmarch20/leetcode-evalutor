import Docker from "dockerode";

import CodeExecutorStrategy, { ExecutionResponse } from "../types/CodeExecutorStrategy";
import { PYTHON_IMAGE } from "../utils/constants";
import createContainer from "./containerFactory";
import decodeDockerStream from "./dockerHelper";
import pullImage from "./pullImage";

class PythonExecutor implements CodeExecutorStrategy {
  async execute(
    code: string,
    inputTestCase: string,
    outputTestCase: string
  ): Promise<ExecutionResponse> {
    console.log("Code to execute:", code);
    console.log("Input:", inputTestCase);
    console.log("Expected Output:", outputTestCase);

    // Pull latest Python image
    await pullImage(PYTHON_IMAGE);

    console.log("Initializing a new Python Docker container");

    const runCommand = `
cat << 'EOF' > test.py
${code}
EOF
echo '${inputTestCase}' | python3 test.py
`;

    const pythonDockerContainer: Docker.Container = await createContainer(PYTHON_IMAGE, [
      "/bin/sh",
      "-c",
      runCommand,
    ]);

    try {
      await pythonDockerContainer.start();
      console.log("Docker container started");

      // Wait for the container to finish execution
      await pythonDockerContainer.wait();

      // Fetch logs after execution
      const logs = await pythonDockerContainer.logs({
        stdout: true,
        stderr: true,
      });

      // Ensure logs are Buffer[]
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
      await pythonDockerContainer.remove();
    }
  }
}

export default PythonExecutor;
