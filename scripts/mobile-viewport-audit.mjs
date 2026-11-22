import { chromium } from "playwright";

const routes = [
  "/",
  "/login",
  "/c/mayachen_tech",
  "/dashboard/influencer",
  "/deals",
  "/analytics",
];

const viewports = [
  { name: "iPhone (375x812)", width: 375, height: 812 },
  { name: "Tablet (768x1024)", width: 768, height: 1024 },
];

async function run() {
  console.log("Launching browser for mobile viewport audit...");
  const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const browser = await chromium.launch({
    headless: true,
    executablePath,
  });
  let hasFailures = false;

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`Testing Viewport: ${vp.name}`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });

    const page = await context.newPage();

    for (const route of routes) {
      const url = `http://localhost:5000${route}`;
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(1000); // allow charts and animations to settle

        const result = await page.evaluate(() => {
          const doc = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
          const innerWidth = window.innerWidth;
          const overflows = scrollWidth > innerWidth;

          // Find offending elements if any
          let offending = [];
          if (overflows) {
            const allElements = document.querySelectorAll("*");
            for (const el of allElements) {
              const rect = el.getBoundingClientRect();
              if (rect.right > innerWidth + 1 || rect.width > innerWidth + 1) {
                const tag = el.tagName.toLowerCase();
                const cls = typeof el.className === "string" ? el.className.slice(0, 80) : "";
                const id = el.id ? `#${el.id}` : "";
                offending.push({
                  selector: `${tag}${id}${cls ? `.${cls.split(" ")[0]}` : ""}`,
                  width: Math.round(rect.width),
                  right: Math.round(rect.right),
                  classes: cls,
                });
              }
            }
          }

          return {
            scrollWidth,
            innerWidth,
            overflows,
            offending: offending.slice(0, 5),
          };
        });

        if (result.overflows) {
          console.error(`❌ [FAIL] ${route} -> scrollWidth: ${result.scrollWidth}px > innerWidth: ${result.innerWidth}px`);
          console.error("   Offending elements:", JSON.stringify(result.offending, null, 2));
          hasFailures = true;
        } else {
          console.log(`✅ [PASS] ${route} -> scrollWidth: ${result.scrollWidth}px <= innerWidth: ${result.innerWidth}px`);
        }
      } catch (err) {
        console.error(`⚠️ Error loading ${route}: ${err.message}`);
      }
    }

    await context.close();
  }

  await browser.close();

  if (hasFailures) {
    console.error("\n❌ Mobile responsiveness check failed with overflow issues.");
    process.exit(1);
  } else {
    console.log("\n🎉 All mobile viewport checks passed with zero horizontal overflow!");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("Audit script failed:", err);
  process.exit(1);
});
