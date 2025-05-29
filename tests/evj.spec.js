// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'fs';
import csv from 'csv-parser';
import { credentials } from './testData.js';

async function readContractNoFromCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                // Assuming 'contract_no' is the column name
                const contractNoList = results.map(row => row.contract_no.trim());
                resolve(contractNoList);
            })
            .on('error', reject);
    });
}

test('Admin uploads a document and customer sees it', async ({ browser }) => {
    test.setTimeout(60000);

    // Step 1: Admin login and upload
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await adminPage.goto('https://admin.dev.mycoveragehub.com/');
    await adminPage.fill("//input[@class='input c2053dbb5 c10f8401f']", credentials.adminemail);
    await adminPage.fill("//input[@class='input c2053dbb5 cb1683880']", credentials.adminpassword);
    await adminPage.click("//button[@type='submit']");

    await adminPage.waitForTimeout(6000);
    await adminPage.click("//span[text()='Contracts']");
    await adminPage.waitForTimeout(3000);
    await adminPage.click("//span[text()='Bulk Upload']");
    await adminPage.waitForTimeout(3000);
    const csvFilePath = "tests/omega_contracts_testdata for us.csv";
    await adminPage.setInputFiles("input[type='file']", csvFilePath);
    await adminPage.waitForTimeout(3000);
    await adminPage.click("//button[@type='submit']");
    await adminPage.waitForTimeout(3000);

    const failedCount = await adminPage.textContent("//p[@class='text-2xl font-bold text-red-600']");
    console.log("Failed count:", failedCount);

    // Step 2: Customer login
    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();

    await customerPage.goto('https://omega.dev.mycoveragehub.com');
    await customerPage.waitForTimeout(8000);
    await customerPage.click("(//button[text()='Sign in'])[1]");
    await customerPage.fill("//input[@class='input c2053dbb5 c10f8401f']", credentials.useremail);
    await customerPage.fill("//input[@class='input c2053dbb5 cb1683880']", credentials.userpassword);
    await customerPage.click("//button[@type='submit']");
    await customerPage.waitForTimeout(4000);
    const csvContractNos = await readContractNoFromCSV(csvFilePath);
    // Count total number of matching elements
    const totalElements = await customerPage.$$eval("//p[@class='text-[16px] text-black pr-16']",
    els => els.length
    );

// Loop through each element by index
for (let i = 1; i <= totalElements; i++) {
  const xpath = `(//p[@class='text-[16px] text-black pr-16'])[${i}]`;
  const rawContractNo = await customerPage.textContent(xpath);

  if (!rawContractNo) {
    console.warn(`⚠️ No contract number found at index ${i}`);
    continue;
  }
  const contractNo = rawContractNo.trim().replace(/^#/, '');

  
  console.log(`Checking contract [${i}]: ${contractNo}`);

  if (csvContractNos.includes(contractNo)) {
    console.log(`✅ Match found: ${contractNo}`);
  } else {
    console.error(`❌ No match: ${contractNo}`);
  }
}
});
