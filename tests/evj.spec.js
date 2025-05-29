// @ts-check
import { test, expect } from '@playwright/test';
import { credentials } from './testData.js';

test('Admin uploads a document and customer sees it', async ({ browser }) => {
    test.setTimeout(60000);
  // 1. Admin logs in and uploads a document
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  

  await adminPage.goto('https://admin.dev.mycoveragehub.com/'); // change to your actual URL
  await adminPage.fill("//input[@class='input c2053dbb5 c10f8401f']", credentials.adminemail); // change selector & email
  await adminPage.fill("//input[@class='input c2053dbb5 cb1683880']", credentials.adminpassword);       // change selector & password
  await adminPage.click("//button[@type='submit']");                      // change selector

  // Upload document
  await adminPage.waitForTimeout(6000);
  await adminPage.click("//span[text()='Contracts']");
  await adminPage.waitForTimeout(3000);
  await adminPage.click("//span[text()='Bulk Upload']");
  await adminPage.waitForTimeout(3000);
  await adminPage.setInputFiles("input[type='file']", "tests/omega_contracts_testdata for us.csv"); // make sure file exists
  await adminPage.waitForTimeout(3000);
  await adminPage.click("//button[@type='submit']"); 
  await adminPage.waitForTimeout(3000);
  const text = await adminPage.textContent("//p[@class='text-2xl font-bold text-red-600']");
  console.log("Failed count : ",text);


  // // 2. Customer logs in and checks the document
  const customerContext = await browser.newContext(); // separate user session
  const customerPage = await customerContext.newPage();

  await customerPage.goto('https://omega.dev.mycoveragehub.com');
  await adminPage.waitForTimeout(8000);
  await customerPage.click("(//button[text()='Sign in'])[1]") // change URL
  await customerPage.fill("//input[@class='input c2053dbb5 c10f8401f']",credentials.useremail); // change selector & email
  await customerPage.fill("//input[@class='input c2053dbb5 cb1683880']", credentials.userpassword);       // change selector & password
  await customerPage.click("//button[@type='submit']");


 
});