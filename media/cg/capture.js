// board.html 을 프레임 단위로 캡처한다. 시간은 renderAt(t)로 직접 지정하므로
// 실제 경과시간과 무관하게 항상 같은 결과가 나온다.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const outDir = process.argv[2];
  const fps = Number(process.argv[3] || 30);
  const only = process.argv[4] ? Number(process.argv[4]) : null; // 미리보기용 단일 시각(초)

  // 이 환경에 미리 설치된 크로미움을 쓴다 (playwright 번들 버전과 무관)
  const CHROME = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const launchOpts = require('fs').existsSync(CHROME) ? CHROME : undefined;
  const ARGS = ['--force-device-scale-factor=1', '--font-render-hinting=none'];
  const browser = await chromium.launch({ executablePath: launchOpts, args: ARGS });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, 'board.html'));
  await page.waitForFunction(() => typeof window.renderAt === 'function');

  if (only !== null) {
    await page.evaluate(t => window.renderAt(t), only);
    await page.screenshot({ path: outDir });
    console.log('preview:', outDir, 't=' + only);
    await browser.close();
    return;
  }

  const total = await page.evaluate(() => window.TOTAL);
  const swooshes = await page.evaluate(() => window.SWOOSH_TIMES);
  const frames = Math.round(total * fps);

  // 스크린샷은 브라우저 프로세스 안에서 직렬화된다. 페이지를 여러 개 띄워도
  // 한 코어만 쓰므로, 코어 수만큼 브라우저를 따로 띄워야 실제로 병렬이 된다.
  const workers = Number(process.env.CAPTURE_WORKERS || require('os').cpus().length);
  const extra = [];
  for (let w = 1; w < workers; w++) {
    const br = await chromium.launch({ executablePath: launchOpts, args: ARGS });
    const pg = await br.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    await pg.goto('file://' + path.resolve(__dirname, 'board.html'));
    await pg.waitForFunction(() => typeof window.renderAt === 'function');
    extra.push({ br, pg });
  }
  const units = [{ br: null, pg: page }, ...extra];
  await Promise.all(units.map(async ({ pg }, w) => {
    for (let f = w; f < frames; f += workers) {
      await pg.evaluate(t => window.renderAt(t), f / fps);
      await pg.screenshot({ path: path.join(outDir, String(f).padStart(5, '0') + '.png') });
    }
  }));
  for (const { br } of extra) await br.close();

  console.log(JSON.stringify({ frames, fps, total, swooshes, workers }));
  await browser.close();
})();
