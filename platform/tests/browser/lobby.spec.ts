import { test, expect } from "@playwright/test";
test("language switch persists and calendar friend actions are explicitly samples", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Ngôn ngữ").selectOption("en");
  await expect(page.getByRole("heading", { name: "Hello, Yến" })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "With friends", exact: true }).click();
  await page
    .locator(".fc-event")
    .filter({ hasText: "Study at the library" })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("Real life: Studying", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog").locator(".pixel-scene")).toHaveCount(0);
  await expect(page.getByRole("dialog")).not.toContainText("Fishing");
  await page
    .getByRole("button", { name: "Send encouragement", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "nothing was sent to a real person",
  );
  await page
    .getByRole("button", { name: "Close", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("adds a private activity, records completion and restores it after reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Ngôn ngữ").selectOption("en");
  await page.getByRole("button", { name: "Add activity", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Activity name").fill("Write report");
  await dialog.getByLabel("Note", { exact: true }).fill("Review the draft");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await page
    .locator(".fc-event")
    .filter({ hasText: "Write report" })
    .first()
    .click();
  await expect(dialog.getByText("Only me", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Record completion" }).click();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.reload();
  await page
    .locator("nav:visible")
    .getByRole("link", { name: "Journal", exact: true })
    .click();
  await expect(
    page.getByRole("button").filter({ hasText: "Write report" }),
  ).toBeVisible();
  await expect(
    page.getByText("Review the draft", { exact: true }),
  ).toBeVisible();
});
test("fits viewport and provides app instructions and responsive detail placement", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByTestId("lobby-shell")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (testInfo.project.name === "mobile") {
    await expect(page.locator(".mobile-bottom-nav")).toBeVisible();
    await expect(page.locator(".desktop-sidebar")).not.toBeVisible();
  } else {
    await expect(page.locator(".desktop-sidebar")).toBeVisible();
    await expect(page.locator(".mobile-bottom-nav")).not.toBeVisible();
  }
  await page.screenshot({
    path: `test-results/lobby-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByLabel("Ngôn ngữ").selectOption("en");
  await page.goto("/#/settings");
  await expect(
    page.getByText(
      "This is a PWA app. Native Android/iOS/Windows packages are not available yet.",
    ),
  ).toBeVisible();
});
test("responsive widths do not overflow and standalone mode is recognized", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "standalone", { value: true }),
  );
  await page.goto("/");
  await expect(page.getByTestId("lobby-shell")).toHaveClass(/app-mode/);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    await page.waitForTimeout(150);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("PWA keeps the local lobby available after going offline", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByLabel("Ngôn ngữ").selectOption("en");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Initial prompt-mode registration controls the next navigation.
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Hello, Yến" })).toBeVisible();
  await expect(
    page.getByText(
      "Offline · sample activities can still be viewed and recorded",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add activity", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Activity name").fill("Offline plan");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.locator(".fc-event").filter({ hasText: "Offline plan" }).first(),
  ).toBeVisible();
});

test("lobby characters represent real-life status and do not expose game controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Ngôn ngữ").selectOption("en");
  await expect(page.locator(".pixel-scene")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Fishing", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Studying", exact: true }).click();
  await expect(page.locator(".life-summary:visible .life-badge")).toHaveText(
    "Studying",
  );
  await page.goto("/#/friends");
  const linh = page.locator(".friend-card").filter({ hasText: "Linh" });
  await expect(linh.locator(".life-portrait")).toContainText("Studying");
  await expect(linh).not.toContainText("Fishing");
  await linh.getByRole("button", { name: "View calendar" }).click();
  await expect(
    page
      .locator(".fc-event")
      .filter({ hasText: "Study at the library" })
      .first(),
  ).toBeVisible();
});
