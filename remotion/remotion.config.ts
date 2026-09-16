import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// 로컬에서는 Remotion이 전용 Chrome Headless Shell을 자동으로 내려받고,
// 구글 폰트도 그대로 불러온다. 다운로드가 막혀 있거나 가로채는 프록시가 낀
// 환경(CI, 샌드박스)에서만 아래 두 환경변수로 우회한다.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}

// 프록시가 자체 CA로 TLS를 종단하면 렌더 브라우저가 fonts.gstatic.com 인증서를
// 거부한다. 폰트를 못 받으면 한글이 폴백으로 렌더되므로 그때만 켠다.
if (process.env.REMOTION_IGNORE_CERT_ERRORS === "1") {
  Config.setChromiumIgnoreCertificateErrors(true);
}
