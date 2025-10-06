import JavaExecutor from "../containers/javaExecutor";
import JavasciptExecutor from "../containers/javascriptExecutor";
import PythonExecutor from "../containers/pythonExecutor";
import CodeExecutorStrategy from "../types/CodeExecutorStrategy";

export default function createExecutor(
  codeLanguage: string
): CodeExecutorStrategy | null {
  if (codeLanguage.toLowerCase() === "python") {
    return new PythonExecutor();
  } else if (codeLanguage.toLowerCase() === "java") {
    return new JavaExecutor();
  } else if (codeLanguage.toLowerCase() === "javascript") {
    return new JavasciptExecutor();
  } else {
    return null;
  }
}
