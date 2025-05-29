// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'fs';
import csv from 'csv-parser';
import { credentials } from './testData.js';

async function readAllDataFromCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results); // return all rows as array of objects
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

    const failedCountText = await adminPage.textContent("//p[@class='text-2xl font-bold text-red-600']");
   const failedCount = parseInt(failedCountText?.trim() || '0', 10);

   console.log("Failed count:", failedCount);

   if (failedCount > 0) {
   console.error("❌ Test failed. Closing browser...");
   await adminPage.close(); // or browser.close()
   return; // Exit the function early
 }


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
    const ContractNos = await readAllDataFromCSV(csvFilePath);
    const csvContractNos = ContractNos[0].contract_no;
    console.log("CSV Contract Numbers:", csvContractNos);
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
    await customerPage.click(xpath);
    await customerPage.waitForTimeout(3000);
    await customerPage.click("//button[@class='underline text-sm text-primary flex gap-2 link']");
    await customerPage.waitForTimeout(3000);
    // Verify Start Date
    const Startdate = await readAllDataFromCSV(csvFilePath);
    const csvStartdate = Startdate[0].start_date;
    console.log("CSV Start date:", csvStartdate);
    const startdate = await customerPage.textContent("(//td[@class='px-6 py-4'])[2]");
    if (csvStartdate.includes(startdate)) {
    console.log(`✅ Match found: ${startdate}`);
    }
    else {
    console.error(`❌ No match for Start Date: ${startdate}`);
    }

    // Verify End Date
    const Enddate = await readAllDataFromCSV(csvFilePath);
    const csvEnddate = Enddate[0].end_date;
    console.log("CSV End date:", csvEnddate);
    const enddate = await customerPage.textContent("(//td[@class='px-6 py-4'])[3]");
    if (csvEnddate.includes(enddate)) {
    console.log(`✅ Match found: ${enddate}`);
    }
    else {  
    console.error(`❌ No match for End Date: ${enddate}`);
    }

    // Verify saledate
    const Saledate = await readAllDataFromCSV(csvFilePath);
    const csvSaledate = Saledate[0].sale_date;
    console.log("CSV Sale date:", csvSaledate);
    const saledate = await customerPage.textContent("(//td[@class='px-6 py-4'])[4]");
    if (csvSaledate.includes(saledate)) {
    console.log(`✅ Match found: ${saledate}`);
    }
    else {
    console.error(`❌ No match for Sale Date: ${saledate}`);
    }

    // Verify Plan code
    const Planterm = await readAllDataFromCSV(csvFilePath);
    const csvPlanterm = Planterm[0].plan_term;
    console.log("CSV Plan term:", csvPlanterm);
    const planterm = await customerPage.textContent("(//td[@class='px-6 py-4'])[6]");
    if (csvPlanterm.includes(planterm)) {
    console.log(`✅ Match found: ${planterm}`);
    }
    else {
    console.error(`❌ No match for Sale Date: ${planterm}`);
    }

    


    


  } else {
    if(i== totalElements) {
      console.error(`❌ No match found for contract number: ${csvContractNos}`);
    }
   
  }
}
});
