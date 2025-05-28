// @ts-check
import { test, expect } from '@playwright/test';
import { selectors } from './locators.js';
import { credentials } from './testData.js';

test('Login and navigate to dashboard', async ({ page }) => {
  await page.goto('https://omega.dev.mycoveragehub.com/');

  await page.click(selectors.signInButton);
  await page.fill(selectors.emailInput, credentials.email);
  await page.fill(selectors.passwordInput, credentials.password);
  await page.click(selectors.submitButton);

  await page.screenshot({ path: 'screenshots/homepage.png', fullPage: true });

  await expect(page).toHaveURL('https://omega.dev.mycoveragehub.com/dashboard');

  await page.click(selectors.dashboardCard);
  await page.waitForLoadState('networkidle');

  console.log('New URL:', page.url());
});
