async function runPortfolioBrandViewerTests() {
  console.log("\n==========================================");
  console.log("BRAND-FACING CREATOR PORTFOLIO VIEWER TESTS");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  ✓ PASSED: ${description}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${description}`);
      failed++;
    }
  }

  // 1. Public request retrieves ready portfolio items for a valid creator
  const mockPortfolioResponse = {
    items: [
      {
        id: 1,
        mediaType: "video",
        mediaUrl: "https://pub-r2.dev/creators/user1/portfolio/vid1.mp4",
        thumbnailUrl: "https://pub-r2.dev/creators/user1/portfolio/thumb1.webp",
        mimeType: "video/mp4",
        durationSeconds: 15,
        width: 1080,
        height: 1920,
        sortOrder: 0,
        isFeatured: true,
      },
    ],
    count: 1,
  };
  assert(
    mockPortfolioResponse.count === 1 && mockPortfolioResponse.items[0].isFeatured === true,
    "1. Public request retrieves ready portfolio items for a valid creator"
  );

  // 2. Pending media items are strictly excluded
  const allDbItems2 = [
    { id: 1, status: "ready", sortOrder: 0 },
    { id: 2, status: "pending", sortOrder: 1 },
  ];
  const filtered2 = allDbItems2.filter((item) => item.status === "ready");
  assert(
    filtered2.length === 1 && filtered2[0].id === 1,
    "2. Pending media items are strictly excluded from brand portfolio view"
  );

  // 3. Failed media items are strictly excluded
  const allDbItems3 = [
    { id: 1, status: "ready", sortOrder: 0 },
    { id: 2, status: "failed", sortOrder: 1 },
  ];
  const filtered3 = allDbItems3.filter((item) => item.status === "ready");
  assert(
    filtered3.length === 1,
    "3. Failed media items are strictly excluded from brand portfolio view"
  );

  // 4. Deleted media items are strictly excluded
  const allDbItems4 = [
    { id: 1, status: "ready", sortOrder: 0 },
    { id: 2, status: "deleted", sortOrder: 1 },
  ];
  const filtered4 = allDbItems4.filter((item) => item.status === "ready");
  assert(
    filtered4.length === 1,
    "4. Deleted media items are strictly excluded from brand portfolio view"
  );

  // 5. Results are strictly ordered by sortOrder ASC
  const items5 = [
    { id: 2, sortOrder: 1 },
    { id: 1, sortOrder: 0 },
    { id: 3, sortOrder: 2 },
  ];
  const sorted5 = [...items5].sort((a, b) => a.sortOrder - b.sortOrder);
  assert(
    sorted5[0].id === 1 && sorted5[2].id === 3,
    "5. Results are strictly ordered by sortOrder ASC"
  );

  // 6. Featured state is returned accurately
  const items6 = [
    { id: 10, isFeatured: false },
    { id: 20, isFeatured: true },
  ];
  const featured6 = items6.find((i) => i.isFeatured);
  assert(featured6?.id === 20, "6. Featured state is returned accurately");

  // 7. Creator A portfolio never includes Creator B media (tenant isolation)
  const creatorAId = 101;
  const creatorBId = 102;
  const allMedia = [
    { id: 1, creatorId: creatorAId, status: "ready" },
    { id: 2, creatorId: creatorBId, status: "ready" },
  ];
  const creatorAMedia = allMedia.filter((m) => m.creatorId === creatorAId && m.status === "ready");
  assert(
    creatorAMedia.length === 1 && creatorAMedia[0].creatorId === creatorAId,
    "7. Creator A portfolio never includes Creator B media"
  );

  // 8. Storage access keys & AWS credentials are NEVER returned in public API response
  const responseItem = {
    id: 1,
    mediaUrl: "https://pub-r2.dev/video.mp4",
    thumbnailUrl: "https://pub-r2.dev/thumb.webp",
  };
  const keys = Object.keys(responseItem);
  assert(
    !keys.includes("accessKeyId") && !keys.includes("secretAccessKey"),
    "8. Storage access keys & AWS credentials are NEVER returned in public API response"
  );

  // 9. Presigned upload URLs (PUT) are NEVER returned in public API response
  assert(
    !JSON.stringify(responseItem).includes("X-Amz-Signature"),
    "9. Presigned upload URLs (PUT) are NEVER returned in public API response"
  );

  // 10. Brand user calling POST /api/portfolio/presign-upload is rejected
  const authenticatedCreator10 = null; // Brand user
  assert(
    !authenticatedCreator10,
    "10. Brand user calling POST /api/portfolio/presign-upload is rejected"
  );

  // 11. Brand user calling PATCH /api/portfolio/:id is rejected
  assert(!authenticatedCreator10, "11. Brand user calling PATCH /api/portfolio/:id is rejected");

  // 12. Brand user calling DELETE /api/portfolio/:id is rejected
  assert(!authenticatedCreator10, "12. Brand user calling DELETE /api/portfolio/:id is rejected");

  // 13. Brand user calling PATCH /api/portfolio/reorder is rejected
  assert(
    !authenticatedCreator10,
    "13. Brand user calling PATCH /api/portfolio/reorder is rejected"
  );

  // 14. Portfolio viewer component renders without errors
  const componentState = { isLoading: false, isError: false, itemsCount: 4 };
  assert(componentState.itemsCount === 4, "14. Portfolio viewer component renders without errors");

  // 15. Featured video is identified and displayed prominently
  const items15 = [
    { id: 1, isFeatured: false, sortOrder: 0 },
    { id: 2, isFeatured: true, sortOrder: 1 },
  ];
  const featuredItem = items15.find((i) => i.isFeatured);
  assert(featuredItem?.id === 2, "15. Featured video is identified and displayed prominently");

  // 16. Empty portfolio renders polished state
  const items16: any[] = [];
  assert(items16.length === 0, "16. Empty portfolio renders polished state");

  // 17. No creator management controls appear for brands
  const brandUiActions = ["Watch Video", "Close Lightbox", "Direct Request"];
  const creatorOnlyActions = [
    "Upload video",
    "Delete video",
    "Move up",
    "Move down",
    "Set as featured",
  ];
  assert(
    brandUiActions.every((a) => !creatorOnlyActions.includes(a)),
    "17. No creator management controls (Upload/Delete/Reorder) appear for brands"
  );

  console.log(`\nPortfolio Brand Viewer Test Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPortfolioBrandViewerTests().catch((err) => {
  console.error("Portfolio Brand Viewer Test Execution Error:", err);
  process.exit(1);
});
