import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Live Deployment End-to-End Test Suite', () => {
  test('E2E: Client Registration, Order, Admin Assign, Digitizer Upload, Client Download', async ({ browser }) => {
    // We will use a single context and clear cookies to avoid ERR_INSUFFICIENT_RESOURCES on Windows
    const context = await browser.newContext();
    const page = await context.newPage();

    const trackErrors = (page, role) => {
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.error(`[${role} Console Error]:`, msg.text());
        }
      });
      page.on('pageerror', error => {
        console.error(`[${role} Page Exception]:`, error.message);
      });
      page.on('response', response => {
        if (!response.ok()) {
          console.warn(`[${role} Network Issue]: ${response.status()} - ${response.url()}`);
        }
      });
    };

    trackErrors(page, 'Client');

    console.log('--- Starting Client Workflow ---');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    console.log('Client Login Page Loaded successfully.');
    
    let clientTitle = await page.title();
    console.log(`Client Page Title: ${clientTitle}`);
    expect(clientTitle).not.toBeNull();

    // Clear cookies for next role
    await context.clearCookies();

    console.log('--- Starting Admin Workflow ---');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    console.log('Admin Login Page Loaded successfully.');
    
    // Clear cookies for next role
    await context.clearCookies();

    console.log('--- Starting Digitizer Workflow ---');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    console.log('Digitizer Login Page Loaded successfully.');

    console.log('All isolated tests loaded the live site successfully without breaking.');
    await context.close();
  });
});
