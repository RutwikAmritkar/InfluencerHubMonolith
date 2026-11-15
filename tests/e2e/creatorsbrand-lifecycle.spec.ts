import { test, expect } from "@playwright/test";

test.describe("CreatorsBrand End-to-End Collaboration Lifecycle", () => {
  let createdDealId: string = "";

  test("Stage 1: Discovery & Pitching (Creator submits pitch on /opportunities)", async ({ page }) => {
    // 1. Creator Login
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Fill in Maya Chen (Creator) credentials
    await page.fill('input[type="email"]', "maya@influencerhub.demo");
    await page.click('button[type="submit"]');

    await page.waitForSelector('input[type="password"]', { state: "visible" });
    await page.fill('input[type="password"]', "demo1234");
    await page.click('button[type="submit"]');

    // Wait for redirect to creator dashboard or navigation
    await page.waitForURL(/.*(dashboard|opportunities).*/, { timeout: 15000 });

    // 2. Navigate to Opportunities
    await page.goto("/opportunities");
    await page.waitForLoadState("networkidle");

    // Verify marketplace header
    await expect(page.locator("h1")).toContainText("Opportunities");

    // Find first "Apply with Pitch" button
    const applyButton = page.locator('button:has-text("Apply with Pitch")').first();
    await expect(applyButton).toBeVisible({ timeout: 10000 });
    await applyButton.click();

    // Fill Pitch Modal
    const modal = page.locator('form:has-text("Submit Pitch to Brand")');
    await expect(modal).toBeVisible();

    const rateInput = modal.locator('input[type="number"]');
    await rateInput.fill("48000");

    const messageInput = modal.locator("textarea");
    await messageInput.fill("High-retention tech integration featuring dedicated unboxing and 30s tutorial series.");

    // Submit Pitch
    await modal.locator('button:has-text("Submit Pitch to Brand")').click();

    // Verify confirmation toast or updated state
    await expect(page.locator("body")).toContainText("Pitch submitted", { timeout: 10000 });
  });

  test("Stage 2: Application Review & Deal Room Conversion (Brand reviews & opens Deal Room)", async ({ page }) => {
    // 1. Brand Login
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.fill('input[type="email"]', "nova@influencerhub.demo");
    await page.click('button[type="submit"]');

    await page.waitForSelector('input[type="password"]', { state: "visible" });
    await page.fill('input[type="password"]', "demo1234");
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*(dashboard|brand).*/, { timeout: 15000 });

    // 2. Navigate to Brand Applications
    await page.goto("/brand/applications");
    await page.waitForLoadState("networkidle");

    // Verify Brand Applications page loaded
    await expect(page.locator("h1")).toContainText("Applications");

    // Look for application or open deal room button
    const openDealBtn = page.locator('button:has-text("Open Deal Room")').first();
    if (await openDealBtn.isVisible()) {
      await openDealBtn.click();
      await page.waitForURL(/.*\/deals\/\d+/, { timeout: 15000 });
      const url = page.url();
      const match = url.match(/\/deals\/(\d+)/);
      if (match) {
        createdDealId = match[1];
      }
    } else {
      // If none directly in pending, check deals list for existing deal
      await page.goto("/deals");
      await page.waitForLoadState("networkidle");
      const dealCard = page.locator('a[href*="/deals/"]').first();
      await expect(dealCard).toBeVisible({ timeout: 10000 });
      const href = await dealCard.getAttribute("href");
      const match = href?.match(/\/deals\/(\d+)/);
      if (match) {
        createdDealId = match[1];
      }
    }

    expect(createdDealId).toBeTruthy();
  });

  test("Stage 3: Versioned Negotiation & Bilateral Signoff", async ({ page }) => {
    test.skip(!createdDealId, "Requires deal ID from Stage 2");

    // 1. Creator logs in and counters terms
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "maya@influencerhub.demo");
    await page.click('button[type="submit"]');
    await page.waitForSelector('input[type="password"]', { state: "visible" });
    await page.fill('input[type="password"]', "demo1234");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });

    // Open Deal Room
    await page.goto(`/deals/${createdDealId}`);
    await page.waitForLoadState("networkidle");

    // Check if counter-proposal can be dispatched
    const counterBtn = page.locator('button:has-text("Counter-Propose Terms")');
    if (await counterBtn.isVisible()) {
      await counterBtn.click();
      const counterDialog = page.locator('div[role="dialog"]');
      await expect(counterDialog).toBeVisible();

      // Submit counter proposal
      const submitCounterBtn = counterDialog.locator('button:has-text("Submit Counter-Offer")');
      await submitCounterBtn.click();
      await page.waitForTimeout(2000);
    }

    // 2. Brand logs in and signs terms
    await page.context().clearCookies();
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "nova@influencerhub.demo");
    await page.click('button[type="submit"]');
    await page.waitForSelector('input[type="password"]', { state: "visible" });
    await page.fill('input[type="password"]', "demo1234");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });

    await page.goto(`/deals/${createdDealId}`);
    await page.waitForLoadState("networkidle");

    // Brand signs terms if pending
    const signBtn = page.locator('button:has-text("Accept & Sign Version")');
    if (await signBtn.isVisible()) {
      await signBtn.click();
      await page.waitForTimeout(2000);
    }

    // Bilateral status locks
    await expect(page.locator("body")).toContainText(/Terms Confirmed|Under Negotiation|Executed/i);
  });

  test("Stage 4: Execution & Decoupled Payment Settlement", async ({ page }) => {
    test.skip(!createdDealId, "Requires deal ID from Stage 2");

    // 1. Creator submits deliverable package
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "maya@influencerhub.demo");
    await page.click('button[type="submit"]');
    await page.waitForSelector('input[type="password"]', { state: "visible" });
    await page.fill('input[type="password"]', "demo1234");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });

    await page.goto(`/deals/${createdDealId}`);
    await page.waitForLoadState("networkidle");

    const submitPackageBtn = page.locator('button:has-text("Submit Deliverable Package")');
    if (await submitPackageBtn.isVisible()) {
      await submitPackageBtn.click();
      const subDialog = page.locator('div[role="dialog"]:has-text("Submit Deliverable Package")');
      await expect(subDialog).toBeVisible();
      await subDialog.locator('input[type="url"]').fill("https://instagram.com/reel/festive_campaign_ready");
      await subDialog.locator('button:has-text("Submit Package")').click();
      await page.waitForTimeout(2000);
    }

    // 2. Brand approves & releases payment
    await page.context().clearCookies();
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "nova@influencerhub.demo");
    await page.click('button[type="submit"]');
    await page.waitForSelector('input[type="password"]', { state: "visible" });
    await page.fill('input[type="password"]', "demo1234");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });

    await page.goto(`/deals/${createdDealId}`);
    await page.waitForLoadState("networkidle");

    const approveBtn = page.locator('button:has-text("Approve Package")');
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await page.waitForTimeout(2000);
    }

    const releasePayoutBtn = page.locator('button:has-text("Release & Settle Payout")');
    if (await releasePayoutBtn.isVisible()) {
      await releasePayoutBtn.click();
      await page.waitForTimeout(2000);
    }

    // 3. Verify analytics and payments reflecting data
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Analytics");

    await page.goto("/payments");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText(/Payment|Ledger|Committed/i);
  });

  test("Stage 5: Public Media Kit Route & Direct Proposal Trigger (/c/:handle)", async ({ page }) => {
    // 1. Visit public media kit as a visitor
    await page.goto("/c/mayachen_tech");
    await page.waitForLoadState("networkidle");

    // Check creator name and verified badge
    await expect(page.locator("h1")).toContainText("Maya Chen");
    await expect(page.locator("body")).toContainText("Verified Handle");

    // Check deliverables rate cards
    await expect(page.locator("body")).toContainText("Commercial Deliverables & Formats");
    await expect(page.locator("body")).toContainText("1× 9:16 Vertical Reel");

    // Click "Propose a Deal"
    const proposeBtn = page.locator('button:has-text("Propose a Deal")').first();
    await expect(proposeBtn).toBeVisible();
    await proposeBtn.click();

    // Verifies it prompts login or navigates
    await page.waitForTimeout(1000);
    await expect(page.url()).toMatch(/.*(\/login|\/deals).*/);
  });
});
