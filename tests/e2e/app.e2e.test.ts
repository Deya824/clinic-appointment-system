/**
 * Selenium E2E tests: headless Chrome.
 * Requires the dev server to be running: npm run dev
 * Run with: npm run test:e2e
 *
 * Env vars:
 *   E2E_BASE_URL     default: http://localhost:3000
 *   E2E_EMAIL        default: admin@clinic.com
 *   E2E_PASSWORD     default: Admin1234!
 *   E2E_PATIENT_ID   patient id printed by npm run seed
 *   E2E_DOCTOR_ID    doctor id printed by npm run seed
 *   E2E_SKIP_BOOKING set to 1 to skip the valid-booking test on purpose
 */

import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const E2E_EMAIL = process.env.E2E_EMAIL ?? 'admin@clinic.com';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'Admin1234!';
const WAIT_MS = 10_000;

function buildDriver(): WebDriver {
  // Options are built in separate statements so the type stays chrome.Options
  const opts = new chrome.Options();
  opts.addArguments(
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1280,800'
  );
  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(opts as unknown as chrome.Options)
    .build();
}

// Wait until #msg exists AND has some text, then return the text
async function waitForMessage(driver: WebDriver): Promise<string> {
  const el = await driver.wait(until.elementLocated(By.id('msg')), WAIT_MS);
  await driver.wait(async () => (await el.getText()).trim().length > 0, WAIT_MS);
  return el.getText();
}

describe('E2E: Clinic App', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = buildDriver();
  }, 30_000);

  afterAll(async () => {
    await driver.quit();
  });

  // Test 1: Swagger UI loads
  test('Swagger UI page loads and shows the API title', async () => {
    await driver.get(`${BASE_URL}/api-docs`);
    await driver.wait(until.elementLocated(By.css('.swagger-ui')), WAIT_MS);
    await driver.wait(until.elementLocated(By.css('.swagger-ui .title')), WAIT_MS);
    const pageSource = await driver.getPageSource();
    expect(pageSource).toMatch(/Clinic Appointment/i);
  }, 30_000);

  // Test 2: Login with seeded admin
  test('Login with valid credentials goes to /dashboard', async () => {
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.id('email')), WAIT_MS);

    await driver.findElement(By.id('email')).sendKeys(E2E_EMAIL);
    await driver.findElement(By.id('password')).sendKeys(E2E_PASSWORD);
    await driver.findElement(By.id('login-btn')).click();

    await driver.wait(
      until.urlContains('/dashboard'),
      WAIT_MS,
      'Expected redirect to /dashboard after login'
    );
    expect(await driver.getCurrentUrl()).toContain('/dashboard');
  }, 30_000);

  // Test 3: Empty booking form shows an error
  test('Submitting an empty booking form shows an error in #msg', async () => {
    await driver.get(`${BASE_URL}/book`);
    await driver.wait(until.elementLocated(By.id('book-btn')), WAIT_MS);

    // Remove browser "required" blocking so the page/API validation runs
    await driver.executeScript(
      `document.querySelectorAll('form').forEach(f => f.setAttribute('novalidate', ''));`
    );
    await driver.findElement(By.id('book-btn')).click();

    const msgText = await waitForMessage(driver);
    expect(msgText.length).toBeGreaterThan(0);
  }, 30_000);

  // Test 4: Valid booking
  test('Valid booking succeeds', async () => {
    if (process.env.E2E_SKIP_BOOKING === '1') {
      console.log('SKIPPED on purpose (E2E_SKIP_BOOKING=1).');
      return;
    }

    const patientId = process.env.E2E_PATIENT_ID;
    const doctorId = process.env.E2E_DOCTOR_ID;
    if (!patientId || !doctorId) {
      throw new Error(
        'Set E2E_PATIENT_ID and E2E_DOCTOR_ID (printed by npm run seed), or set E2E_SKIP_BOOKING=1.'
      );
    }

    await driver.get(`${BASE_URL}/book`);
    await driver.wait(until.elementLocated(By.id('patient-id')), WAIT_MS);

    // A slot 2-3 hours from now (random day offset avoids double-booking on reruns)
    const dayOffset = Math.floor(Math.random() * 60) + 1;
    const start = new Date(Date.now() + dayOffset * 86_400_000 + 2 * 3_600_000);
    const end = new Date(start.getTime() + 3_600_000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    await driver.findElement(By.id('patient-id')).sendKeys(patientId);
    await driver.findElement(By.id('doctor-id')).sendKeys(doctorId);

    // Set datetime-local values with JS and fire input events so React sees them
    await driver.executeScript(
      `const set = (id, v) => {
         const el = document.getElementById(id);
         const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
         setter.call(el, v);
         el.dispatchEvent(new Event('input', { bubbles: true }));
         el.dispatchEvent(new Event('change', { bubbles: true }));
       };
       set('start', arguments[0]);
       set('end', arguments[1]);`,
      fmt(start),
      fmt(end)
    );
    await driver.findElement(By.id('book-btn')).click();

    const msgText = await waitForMessage(driver);
    expect(msgText).toMatch(/booked|appointment/i);
  }, 30_000);
});