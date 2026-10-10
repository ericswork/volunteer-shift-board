// Runs axe-core on every main screen at desktop and phone width, signed in where needed, and
// exits with 1 on any serious or critical violation. Start the app first (npm run dev at the
// repo root).
import { readFileSync } from 'node:fs';
import { button, firstEventPath, launchChrome, openPage, READY, signIn, sleep } from './browser.mjs';

const AXE = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const WIDTHS = [1280, 390];
const BLOCKING = ['serious', 'critical'];

const SCREENS = [
  { role: 'visitor', name: 'Events list', path: '/', ready: READY.events },
  { role: 'visitor', name: 'Event detail', path: 'first-event', ready: READY.eventDetail },
  { role: 'volunteer', name: 'Event detail', path: 'first-event', ready: READY.eventDetail },
  { role: 'volunteer', name: 'My shifts', path: '/my-shifts', ready: READY.myShifts },
  { role: 'admin', name: 'Admin', path: '/admin', ready: READY.admin },
  {
    role: 'admin',
    name: 'Admin, shift form errors',
    path: '/admin',
    ready: READY.admin,
    then: `${button('Add shift')}.click()`,
    settled: `document.querySelectorAll('form [aria-invalid="true"]').length > 0`,
  },
  {
    role: 'admin',
    name: 'Admin, New event dialog',
    path: '/admin',
    ready: READY.admin,
    then: `${button('New event')}.click()`,
    settled: `!!document.querySelector('[role="dialog"]')`,
  },
];

async function runAxe(page) {
  await page.evaluate(AXE);
  return page.evaluate(`axe.run(document, { resultTypes: ['violations'] }).then((r) =>
    r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.map((n) => n.target.join(' ')) })))`);
}

const { browser, close } = await launchChrome();
let blocking = 0;
try {
  const pages = {};
  let eventPath;

  for (const screen of SCREENS) {
    if (!pages[screen.role]) {
      pages[screen.role] = await openPage(browser);
      if (screen.role !== 'visitor') await signIn(pages[screen.role], screen.role);
    }
    const page = pages[screen.role];

    for (const width of WIDTHS) {
      await page.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
      if (screen.path === 'first-event') eventPath ??= await firstEventPath(page);
      const path = screen.path === 'first-event' ? eventPath : screen.path;
      await page.goto(path, screen.ready, `${screen.name} (${screen.role}, ${width}px)`);
      if (screen.then) {
        await page.evaluate(screen.then);
        await page.waitFor(screen.settled, `${screen.name} to settle`);
        await sleep(300);
      }

      const violations = await runAxe(page);
      const label = `${screen.name} as ${screen.role} at ${width}px`;
      const serious = violations.filter((v) => BLOCKING.includes(v.impact));
      blocking += serious.length;
      console.log(`${serious.length ? 'FAIL' : 'PASS'}  ${label}: ${violations.length} violation(s), ${serious.length} serious or critical`);
      for (const v of violations) {
        console.log(`      [${v.impact}] ${v.id}: ${v.help}\n        ${v.targets.slice(0, 5).join('\n        ')}`);
      }
    }
  }
} finally {
  await close();
}

console.log(blocking ? `\n${blocking} serious or critical violation(s)` : '\nNo serious or critical violations');
process.exitCode = blocking ? 1 : 0;
