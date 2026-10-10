// Shared by the a11y and screenshot scripts: drives a headless Chrome over the DevTools protocol.
// Set APP_URL to check another address and CHROME_PATH if Chrome isn't in the default macOS place.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const APP = process.env.APP_URL ?? 'http://localhost:5173';
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const NOTHING_LOADING = `![...document.querySelectorAll('[role="status"]')].some((el) => /Loading|Waking/.test(el.textContent))`;
export const button = (label) =>
  `[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === ${JSON.stringify(label)})`;

// "Loaded" rather than "has data", so the scripts also work on dev data where lists may be empty
export const READY = {
  events: `document.querySelectorAll('main article').length > 0`,
  eventDetail: `!!document.getElementById('choose-a-shift')`,
  myShifts: `!!document.querySelector('main [role="tabpanel"]') &&
    document.querySelector('main h1 + p').textContent !== 'Loading your shifts…'`,
  admin: `!!document.getElementById('roster-heading')`,
};

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
export async function openPage(browser) {
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

export async function signIn(page, role) {
  await page.goto('/login', `!!document.getElementById('login-email')`, 'the login page');
  await page.evaluate(`${button(`Continue as demo ${role}`)}.click()`);
  await page.waitFor(`location.pathname !== '/login'`, `the ${role} sign-in`);
}

export async function launchChrome() {
  const profile = mkdtempSync(join(tmpdir(), 'vsb-chrome-'));
  const chrome = spawn(
    CHROME,
    ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'],
    { stdio: 'ignore' },
  );
  for (let i = 0; i < 50 && !(await fetch(`http://127.0.0.1:${PORT}/json/version`).catch(() => null)); i++) {
    await sleep(200);
  }
  const browser = await connectToBrowser();
  const close = async () => {
    browser.close();
    chrome.kill();
    await sleep(300);
    rmSync(profile, { recursive: true, force: true });
  };
  return { browser, close };
}

// The first event card's link, for screens that need an event page
export async function firstEventPath(page) {
  await page.goto('/', READY.events, 'the events list');
  return page.evaluate(`document.querySelector('main a[href^="/events/"]').getAttribute('href')`);
}
