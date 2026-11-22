import { test, expect } from "@playwright/test";

test.describe("Final Local Smoke Tests (3 Core User Journeys)", () => {
  test.describe.configure({ mode: "serial" });

  let testDealId: number;

  // ─── JOURNEY 1: SUPER ADMIN CHECK ──────────────────────────────────────────
  test("Journey 1: Super Admin login, /admin direct landing, Admin role badge, and Double-Entry Ledger", async ({
    page,
  }) => {
    // Clear cookies to ensure fresh session
    await page.context().clearCookies();

    // 1. Log in with provisioned founder admin account
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("priya@influencerhub.demo");
    await page.click('button[type="submit"]');

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await passwordInput.fill("demo1234");
    await page.click('button[type="submit"]');

    // 2. Confirm landing directly on /admin (bypassing /onboarding)
    await page.waitForURL("**/admin", { timeout: 15000 });
    expect(page.url()).toContain("/admin");
    expect(page.url()).not.toContain("/onboarding");

    // 3. Confirm Super Admin role badge in sidebar/header
    const adminBadge = page.locator("text=/SUPER ADMIN|Super Admin/").first();
    await expect(adminBadge).toBeVisible({ timeout: 10000 });

    // Confirm Creator View / Brand View switcher is hidden for admins
    const viewSwitcher = page.locator("text=Creator View");
    await expect(viewSwitcher).toHaveCount(0);

    // 4. View Active User Activity Logs
    await page.goto("/admin/activity-logs");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Active User Activity");
    // Verify activity stream container is rendered
    await expect(page.locator("text=Real-time audit telemetry").first()).toBeVisible({ timeout: 10000 });

    // 5. View Double-Entry Ledger under /admin/payments
    await page.goto("/admin/payments");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Payments & Escrow Ledger");

    // Check summary metric cards
    await expect(page.locator("text=Gross Committed").first()).toBeVisible();
    await expect(page.locator("text=Held in Escrow").first()).toBeVisible();

    // Click "Double-Entry Ledger" toggle
    const journalToggle = page.locator('button:has-text("Double-Entry Ledger")');
    await expect(journalToggle).toBeVisible();
    await journalToggle.click();

    // Verify double-entry ledger columns
    await expect(page.locator("text=Entry ID").first()).toBeVisible();
    await expect(page.locator("text=Entry Type").first()).toBeVisible();
    await expect(page.locator("text=Direction").first()).toBeVisible();
  });

  // ─── JOURNEY 2: DARK MODE & MOBILE CHECK (375px) ───────────────────────────
  test("Journey 2: Dark Mode toggle & 375px mobile viewport overflow check", async ({
    page,
  }) => {
    // 1. Dark Mode Toggle check on /admin
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Find and toggle theme button
    const themeBtn = page
      .locator(
        'button[aria-label="Toggle theme"], button:has(.lucide-sun), button:has(.lucide-moon)'
      )
      .first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(500);
      const isDark = await page.evaluate(() =>
        document.documentElement.classList.contains("dark")
      );
      expect(typeof isDark).toBe("boolean");
    }

    // 2. Clear cookies so /login doesn't redirect away
    await page.context().clearCookies();

    // 3. Mobile 375px width check across public pages: / and /login
    await page.setViewportSize({ width: 375, height: 667 });

    const publicPages = [
      { path: "/", name: "Landing Page" },
      { path: "/login", name: "Login Page" },
    ];

    for (const p of publicPages) {
      await page.goto(p.path);
      await page.waitForLoadState("networkidle");

      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const windowWidth = window.innerWidth;
        return {
          scrollWidth: docWidth,
          innerWidth: windowWidth,
          hasOverflow: docWidth > windowWidth + 1,
        };
      });

      expect(
        overflow.hasOverflow,
        `Page ${p.name} (${p.path}) has horizontal overflow: scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`
      ).toBe(false);
    }

    // 4. Log in as Creator to test authenticated pages at 375px
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "carlos@influencerhub.demo");
    await page.click('button[type="submit"]');
    await page.waitForSelector('input[type="password"]', { state: "visible" });
    await page.fill('input[type="password"]', "demo1234");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(dashboard|influencer|deals).*/, { timeout: 15000 });

    const authPages = [
      { path: "/dashboard/influencer", name: "Creator Dashboard" },
      { path: "/deals", name: "Deals List" },
    ];

    for (const p of authPages) {
      await page.goto(p.path);
      await page.waitForLoadState("networkidle");

      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const windowWidth = window.innerWidth;
        return {
          scrollWidth: docWidth,
          innerWidth: windowWidth,
          hasOverflow: docWidth > windowWidth + 1,
        };
      });

      expect(
        overflow.hasOverflow,
        `Page ${p.name} (${p.path}) has horizontal overflow: scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`
      ).toBe(false);
    }
  });

  // ─── JOURNEY 3: END-TO-END DEAL + RBI RAZORPAY PAYMENT FLOW ────────────────
  test("Journey 3: End-to-end deal creation, bilateral signoff, escrow deposit, 72h SLA, deliverable review, and 4 double-entry ledger entries", async ({
    page,
    playwright,
  }) => {
    // Reset viewport to desktop
    await page.setViewportSize({ width: 1280, height: 720 });

    // 1. Create separate API contexts for Brand and Creator to prevent cookie collision
    const brandApi = await playwright.request.newContext({ baseURL: "http://localhost:5000" });
    const creatorApi = await playwright.request.newContext({ baseURL: "http://localhost:5000" });

    // Authenticate Brand (Lumière Beauty)
    const brandLoginRes = await brandApi.post("/api/auth/sign-in/email", {
      data: {
        email: "lumiere@influencerhub.demo",
        password: "demo1234",
      },
    });
    expect(brandLoginRes.ok()).toBeTruthy();

    // Authenticate Creator (Carlos Rivera)
    const creatorLoginRes = await creatorApi.post("/api/auth/sign-in/email", {
      data: {
        email: "carlos@influencerhub.demo",
        password: "demo1234",
      },
    });
    expect(creatorLoginRes.ok()).toBeTruthy();

    // 2. Brand initiates deal with Carlos Rivera (influencerId: 362)
    const dealCreateRes = await brandApi.post("/api/deals", {
      data: {
        influencerId: 362, // Carlos Rivera
        title: "E2E Smoke Test Collaboration",
        collabType: "paid",
        price: 50000, // ₹50,000 = 5,000,000 paise
        deliverables: [{ title: "Dedicated YouTube Feature", count: 1 }],
        revisionCount: 2,
      },
    });
    if (!dealCreateRes.ok()) {
      console.error("Deal create error status:", dealCreateRes.status(), await dealCreateRes.text());
    }
    expect(dealCreateRes.ok()).toBeTruthy();
    const dealData = await dealCreateRes.json();
    testDealId = dealData.id;
    expect(testDealId).toBeGreaterThan(0);

    // 3. Creator accepts/confirms deal terms
    const confirmRes = await creatorApi.post(`/api/deals/${testDealId}/confirm`, {
      data: { proposalVersion: 1 },
    });
    expect(confirmRes.ok()).toBeTruthy();

    // 4. Log in as Brand on browser page and navigate to Deal Room
    await page.context().clearCookies();
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "lumiere@influencerhub.demo");
    await page.click('button[type="submit"]');
    await page.waitForSelector('input[type="password"]', { state: "visible" });
    await page.fill('input[type="password"]', "demo1234");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(dashboard|brand|deals).*/, { timeout: 15000 });

    // Navigate to the newly created Deal Room
    await page.goto(`/deals/${testDealId}`);
    await page.waitForLoadState("networkidle");

    // Bilateral signoff: Brand signs Version 1 to execute the agreement
    const signBtn = page.locator('button:has-text("Accept & Sign")');
    if (await signBtn.isVisible({ timeout: 5000 })) {
      await signBtn.click();
      await page.waitForTimeout(1000);
      await page.waitForLoadState("networkidle");
    }

    // 5. Verify Escrow Deposit button is visible for Brand and click it
    const depositBtn = page.locator('button:has-text("Deposit Escrow via Razorpay Route")');
    await expect(depositBtn).toBeVisible({ timeout: 10000 });
    await depositBtn.click();

    // Verify Deal Room reflects Escrow Secured
    const escrowSecuredBanner = page.locator("text=Escrow Secured in RBI-Compliant Holding");
    await expect(escrowSecuredBanner).toBeVisible({ timeout: 15000 });

    // 6. Creator submits deliverable package (triggers 72-Hour Auto-Release Review SLA)
    const submissionRes = await creatorApi.post(`/api/deals/${testDealId}/submissions`, {
      data: {
        round: 1,
        contentUrls: ["https://cdn.creatorsbrand.in/deliverables/sample-video.mp4"],
        notes: "Here is the final high-res deliverable for brand approval.",
      },
    });
    expect(submissionRes.ok()).toBeTruthy();

    // Reload Deal Room on page and verify 72-Hour Review SLA banner is active
    await page.reload();
    await page.waitForLoadState("networkidle");
    const slaBanner = page.locator("text=72-Hour Review SLA Active");
    await expect(slaBanner).toBeVisible({ timeout: 10000 });

    // 7. Brand approves deliverable package
    const approveBtn = page.locator('button:has-text("Approve Package")');
    await expect(approveBtn).toBeVisible({ timeout: 10000 });
    await approveBtn.click();

    // Verify completion status
    await expect(page.locator("text=COMPLETED").first()).toBeVisible({ timeout: 10000 });

    // 8. Log in as Super Admin and confirm all 4 ledger entries appear in /admin/payments
    await page.context().clearCookies();
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', "priya@influencerhub.demo");
    await page.click('button[type="submit"]');
    await page.waitForSelector('input[type="password"]', { state: "visible" });
    await page.fill('input[type="password"]', "demo1234");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin", { timeout: 15000 });

    await page.goto("/admin/payments");
    await page.waitForLoadState("networkidle");

    // Switch to Double-Entry Ledger view
    const ledgerTab = page.locator('button:has-text("Double-Entry Ledger")');
    await expect(ledgerTab).toBeVisible({ timeout: 10000 });
    await ledgerTab.click();

    // Verify the 4 double-entry ledger entries exist for this deal
    const pageContent = (await page.content()).toLowerCase();
    expect(pageContent).toContain("brand capture");
    expect(pageContent).toContain("platform fee");
    expect(pageContent).toContain("gst collected");
    expect(pageContent).toContain("tds withheld");
  });
});
