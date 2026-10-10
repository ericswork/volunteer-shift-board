// Runs axe-core on every main screen at desktop and phone width, signed in where needed, and
// exits with 1 on any serious or critical violation. Start the app first (npm run dev at the
// repo root); set CHROME_PATH if Google Chrome isn't in the default macOS location.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const APP = process.env.APP_URL ?? 'http://localhost:5173';
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const AXE = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const WIDTHS = [1280, 390];
const BLOCKING = ['serious', 'critical'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const NOTHING_LOADING = `![...document.querySelectorAll('[role="status"]')].some((el) => /Loading|Waking/.test(el.textContent))`;
const button = (label) =>
  `[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === ${JSON.stringify(label)})`;

// "Loaded" rather than "has data", so the check also works on dev data where lists may be empty
const MY_SHIFTS_READY = `!!document.querySelector('main [role="tabpanel"]') &&
  document.querySelector('main h1 + p').textContent !== 'Loading your shifts…'`;
const ADMIN_READY = `!!document.getElementById('roster-heading')`;

const SCREENS = [
  { role: 'visitor', name: 'Events list', path: '/', ready: `document.querySelectorAll('main article').length > 0` },
  { role: 'visitor', name: 'Event detail', path: 'first-event', ready: `!!document.getElementById('choose-a-shift')` },
  { role: 'volunteer', name: 'Event detail', path: 'first-event', ready: `!!document.getElementById('choose-a-shift')` },
  { role: 'volunteer', name: 'My shifts', path: '/my-shifts', ready: MY_SHIFTS_READY },
  { role: 'admin', name: 'Admin', path: '/admin', ready: ADMIN_READY },
  {
    role: 'admin',
    name: 'Admin, shift form errors',
    path: '/admin',
    ready: ADMIN_READY,
    then: `${button('Add shift')}.click()`,
    settled: `document.querySelectorAll('form [aria-invalid="true"]').length > 0`,
  },
  {
    role: 'admin',
    name: 'Admin, New event dialog',
    path: '/admin',
    ready: ADMIN_READY,
    then: `${button('New event')}.click()`,
    settled: `!!document.querySelector('[role="dialog"]')`,
  },
];

async function connectToBrowser() {
  const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
  const ws = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let lastId = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++lastId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  return { send, close: () => ws.close() };
}

// Each role gets its own browser context, so sign-ins never leak between them
async function openPage(browser) {
  const { browserContextId } = await browser.send('Target.createBrowserContext');
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params) => browser.send(method, params, sessionId);

  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  };
  const waitFor = async (expression, what) => {
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (await evaluate(expression).catch(() => false)) return;
      await sleep(100);
    }
    throw new Error(`Timed out waiting for ${what}`);
  };
  const goto = async (path, ready, what) => {
    await send('Page.navigate', { url: `${APP}${path}` });
    await sleep(300);
    await waitFor(`(${ready}) && ${NOTHING_LOADING}`, what);
  };
  return { send, evaluate, waitFor, goto };
}

async function signIn(page, role) {
  await page.goto('/login', `!!document.getElementById('login-email')`, 'the login page');
  await page.evaluate(`${button(`Continue as demo ${role}`)}.click()`);
  await page.waitFor(`location.pathname !== '/login'`, `the ${role} sign-in`);
}

async function runAxe(page) {
  await page.evaluate(AXE);
  return page.evaluate(`axe.run(document, { resultTypes: ['violations'] }).then((r) =>
    r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.map((n) => n.target.join(' ')) })))`);
}

const profile = mkdtempSync(join(tmpdir(), 'a11y-chrome-'));
const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'],
  { stdio: 'ignore' },
);

let blocking = 0;
try {
  for (let i = 0; i < 50 && !(await fetch(`http://127.0.0.1:${PORT}/json/version`).catch(() => null)); i++) {
    await sleep(200);
  }
  const browser = await connectToBrowser();
  const pages = {};
  let firstEventPath;

  for (const screen of SCREENS) {
    if (!pages[screen.role]) {
      pages[screen.role] = await openPage(browser);
      if (screen.role !== 'visitor') await signIn(pages[screen.role], screen.role);
    }
    const page = pages[screen.role];

    for (const width of WIDTHS) {
      await page.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
      if (screen.path === 'first-event' && !firstEventPath) {
        await page.goto('/', SCREENS[0].ready, 'the events list');
        firstEventPath = await page.evaluate(`document.querySelector('main a[href^="/events/"]').getAttribute('href')`);
      }
      const path = screen.path === 'first-event' ? firstEventPath : screen.path;
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
  browser.close();
} finally {
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}

console.log(blocking ? `\n${blocking} serious or critical violation(s)` : '\nNo serious or critical violations');
process.exitCode = blocking ? 1 : 0;
