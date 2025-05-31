// @ts-check
import { test, expect } from "@playwright/test";
import fs from "fs";
import csv from "csv-parser";
import { credentials } from "./testData.js";

async function readAllDataFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        resolve(results); // return all rows as array of objects
      })
      .on("error", reject);
  });
}

test("Admin uploads a document and customer sees it", async ({ browser }) => {
  test.setTimeout(60000);

  // Step 1: Admin login and upload
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  await adminPage.goto("https://admin.dev.mycoveragehub.com/");
  await adminPage.fill(
    "//input[@class='input c2053dbb5 c10f8401f']",
    credentials.adminemail
  );
  await adminPage.fill(
    "//input[@class='input c2053dbb5 cb1683880']",
    credentials.adminpassword
  );
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

  const failedCountText = await adminPage.textContent(
    "//p[@class='text-2xl font-bold text-red-600']"
  );
  const failedCount = parseInt(failedCountText?.trim() || "0", 10);

  console.log("Failed count:", failedCount);

  if (failedCount > 0) {
    console.error("❌ Test failed. Closing browser...");
    await adminPage.close(); // or browser.close()
    return; // Exit the function early
  }

  // Step 2: Customer login
  const customerContext = await browser.newContext();
  const customerPage = await customerContext.newPage();

  await customerPage.goto("https://omega.dev.mycoveragehub.com");
  await customerPage.waitForTimeout(6000);
  await customerPage.click("(//button[text()='Sign in'])[1]");
  await customerPage.fill(
    "//input[@class='input c2053dbb5 c10f8401f']",
    credentials.useremail
  );
  await customerPage.fill(
    "//input[@class='input c2053dbb5 cb1683880']",
    credentials.userpassword
  );
  await customerPage.click("//button[@type='submit']");
  await customerPage.waitForTimeout(4000);

  // Read all CSV data once at the top
  const csvData = await readAllDataFromCSV(csvFilePath);
  const {
    contract_no: csvContractNo,
    start_date: csvStartdate,
    end_date: csvEnddate,
    sale_date: csvSaledate,
    plan_term: csvPlanterm,
    billing_method: csvBillingmethod,
    street: csvStreet,
  } = csvData[0];
  console.log("CSV Contract Numbers:", csvContractNo);
  // Count total number of matching elements
  const totalElements = await customerPage.$$eval(
    "//p[@class='text-[16px] text-black pr-16']",
    (els) => els.length
  );

  // Loop through each element by index
  for (let i = 1; i <= totalElements; i++) {
    const xpath = `(//p[@class='text-[16px] text-black pr-16'])[${i}]`;
    const rawContractNo = await customerPage.textContent(xpath);

    if (!rawContractNo) {
      console.warn(`⚠️ No contract number found at index ${i}`);
      continue;
    }

    const contractNo = rawContractNo.trim().replace(/^#/, "");
    console.log(`Checking contract [${i}]: ${contractNo}`);

    if (csvContractNo.includes(contractNo)) {
      console.log(`✅ Match found: ${contractNo}`);
      await customerPage.click(xpath);
      await customerPage.waitForTimeout(6000);
      await customerPage.click(
        "//button[@class='underline text-sm text-primary flex gap-2 link']"
      );

      // Verify Start Date
      const startdate = await customerPage.textContent(
        "(//td[@class='px-6 py-4'])[2]"
      );
      console.log("CSV Start date:", csvStartdate);
      if (csvStartdate.includes(startdate?.trim())) {
        console.log(`✅ Match found: ${startdate}`);
      } else {
        console.error(`❌ No match for Start Date: ${startdate}`);
      }

      // Verify End Date
      const enddate = await customerPage.textContent(
        "(//td[@class='px-6 py-4'])[3]"
      );
      console.log("CSV End date:", csvEnddate);
      if (csvEnddate.includes(enddate?.trim())) {
        console.log(`✅ Match found: ${enddate}`);
      } else {
        console.error(`❌ No match for End Date: ${enddate}`);
      }

      // Verify Sale Date
      const saledate = await customerPage.textContent(
        "(//td[@class='px-6 py-4'])[4]"
      );
      console.log("CSV Sale date:", csvSaledate);
      if (csvSaledate.includes(saledate?.trim())) {
        console.log(`✅ Match found: ${saledate}`);
      } else {
        console.error(`❌ No match for Sale Date: ${saledate}`);
      }

      // Verify Plan Term
      const planterm = await customerPage.textContent(
        "(//td[@class='px-6 py-4'])[6]"
      );
      console.log("CSV Plan term:", csvPlanterm);
      if (csvPlanterm.includes(planterm?.trim())) {
        console.log(`✅ Match found: ${planterm}`);
      } else {
        console.error(`❌ No match for Plan Term: ${planterm}`);
      }

      // Verify Billing Method
      const billingmethod = await customerPage.textContent(
        "(//td[@class='px-6 py-4'])[7]"
      );
      console.log("CSV Billing method:", csvBillingmethod);
      if (csvBillingmethod.includes(billingmethod?.trim())) {
        console.log(`✅ Match found: ${billingmethod}`);
      } else {
        console.error(`❌ No match for Billing Method: ${billingmethod}`);
      }

      // Verify Street
      const street = await customerPage.textContent(
        "(//td[@class='px-6 py-4'])[8]"
      );
      console.log("CSV Street:", csvStreet);
      if (csvStreet.includes(street?.trim())) {
        console.log(`✅ Match found: ${street}`);
      } else {
        console.error(`❌ No match for Street: ${street}`);
      }

      break; // Exit loop after first match, remove if you want to continue checking other entries
    } else {
      if (i === totalElements) {
        console.error(
          `❌ No match found for contract number(s): ${csvContractNo.join(", ")}`
        );
      }
    }
  }
});
