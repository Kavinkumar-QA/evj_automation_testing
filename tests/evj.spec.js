// @ts-check
import { test, expect } from '@playwright/test';

test('Navigate, take screenshot, assert URL, click link', async ({ page }) => {
  await page.goto('https://omega.dev.mycoveragehub.com/');
  await page.click("(//button[text()='Sign in'])[1]");
  await page.fill("//input[@class='input c2053dbb5 c10f8401f']","evjtest6@zentelai.com");
  await page.fill("//input[@class='input c2053dbb5 cb1683880']","Warranty@123");
  await page.click("//button[@type='submit']")
  await page.screenshot({ path: 'screenshots/homepage.png', fullPage: true });
  await expect(page).toHaveURL('https://omega.dev.mycoveragehub.com/dashboard');
  await page.click("(//div[@class='bg-white border-6 border-solid border-[#cbd0dc] rounded-[20px] p-4'])[1]");
  await page.waitForLoadState('networkidle');
  console.log('New URL:', page.url());
});
