import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// 로컬에서는 Remotion이 전용 Chrome Headless Shell을 자동으로 내려받습니다.
// 다운로드가 막힌 환경(CI, 샌드박스 등)에서는 이미 설치된 크로미움 경로를
// REMOTION_BROWSER_EXECUTABLE 환경변수로 지정하면 됩니다.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
