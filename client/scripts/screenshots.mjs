// Captures the four main screens at desktop and phone size into docs/screenshots/, signed in where
// a screen needs it. Start the app first (npm run dev at the repo root) on freshly seeded data.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { firstEventPath, launchChrome, openPage, READY, signIn, sleep } from './browser.mjs';

const OUT = new URL('../../docs/screenshots/', import.meta.url);
const SIZES = [
  { name: 'desktop', width: 1280, height: 860, scale: 1 },
  { name: 'phone', width: 390, height: 844, scale: 2 },
];
const SCREENS = [
  { file: 'events', role: 'visitor', path: '/', ready: READY.events },
  { file: 'event-detail', role: 'volunteer', path: 'first-event', ready: READY.eventDetail },
  { file: 'my-shifts', role: 'volunteer', path: '/my-shifts', ready: READY.myShifts },
  { file: 'admin', role: 'admin', path: '/admin', ready: READY.admin },
];

// Width and height from the PNG header, to prove each file is a real image of the expected size
function pngSize(path) {
  const bytes = readFileSync(path);
  if (bytes.toString('latin1', 1, 4) !== 'PNG') throw new Error(`${path} is not a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

mkdirSync(OUT, { recursive: true });
const { browser, close } = await launchChrome();
try {
  const pages = {};
  let eventPath;

  for (const screen of SCREENS) {
    if (!pages[screen.role]) {
      pages[screen.role] = await openPage(browser);
      await pages[screen.role].send('Emulation.setScrollbarsHidden', { hidden: true });
      if (screen.role !== 'visitor') await signIn(pages[screen.role], screen.role);
    }
    const page = pages[screen.role];

    for (const size of SIZES) {
      await page.send('Emulation.setDeviceMetricsOverride', {
        width: size.width,
        height: size.height,
        deviceScaleFactor: size.scale,
        mobile: size.width < 600,
      });
      if (screen.path === 'first-event') eventPath ??= await firstEventPath(page);
      await page.goto(screen.path === 'first-event' ? eventPath : screen.path, screen.ready, screen.file);
      await page.evaluate('document.fonts.ready.then(() => true)');
      await sleep(500);

      const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
      const path = new URL(`${screen.file}-${size.name}.png`, OUT);
      writeFileSync(path, Buffer.from(data, 'base64'));
      const { width, height } = pngSize(path);
      console.log(`docs/screenshots/${screen.file}-${size.name}.png  ${width}x${height}`);
    }
  }
} finally {
  await close();
}
