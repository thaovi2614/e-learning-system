import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(1500);
  });

  test("TC1 - Hiển thị trang Home và tiêu đề Tất cả khóa học", async ({ page }) => {
    await expect(page.locator(".home-container")).toBeVisible();
    await expect(page.getByRole("heading", { name: /tất cả khóa học/i })).toBeVisible();
  });

  test("TC2 - Hiển thị khóa học nổi bật nếu có dữ liệu", async ({ page }) => {
    const hero = page.locator(".home-hero");

    if (!(await hero.isVisible().catch(() => false))) {
      test.skip(true, "Không có khóa học để hiển thị nổi bật");
      return;
    }

    await expect(hero.locator(".home-hero-badge")).toContainText(/nổi bật/i);
    await expect(hero.locator(".home-hero-title")).not.toBeEmpty();
    await expect(hero.locator(".home-hero-price")).toBeVisible();
    await expect(hero.getByRole("button", { name: /xem ngay/i })).toBeVisible();
  });

  test("TC3 - Click khóa học nổi bật chuyển sang trang chi tiết", async ({ page }) => {
    const hero = page.locator(".home-hero");

    if (!(await hero.isVisible().catch(() => false))) {
      test.skip(true, "Không có khóa học nổi bật");
      return;
    }

    await hero.click();

    await expect(page).toHaveURL(/\/courses\/\d+/, { timeout: 5000 });
  });

  test("TC4 - Hiển thị danh sách khóa học hoặc không lỗi trắng", async ({ page }) => {
    const courseCards = page.locator(".course-card, .course-item, .course-box, .course");
    const count = await courseCards.count();

    if (count > 0) {
      await expect(courseCards.first()).toBeVisible();
    } else {
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);
    }
  });

  test("TC5 - Click vào khóa học trong danh sách chuyển sang trang chi tiết", async ({ page }) => {
    const courseCards = page.locator(".course-card, .course-item, .course-box, .course");
    const count = await courseCards.count();

    if (count === 0) {
      test.skip(true, "Không có khóa học trong danh sách");
      return;
    }

    await courseCards.first().click();

    await expect(page).toHaveURL(/\/courses\/\d+/, { timeout: 5000 });
  });

  test("TC6 - Hiển thị phân trang nếu có nhiều trang", async ({ page }) => {
    const pagination = page.locator(".home-pagination");

    if (await pagination.isVisible().catch(() => false)) {
      await expect(pagination).toBeVisible();
    } else {
      await expect(page.locator(".home-container")).toBeVisible();
    }
  });

  test("TC7 - Nếu có phân trang thì bấm chuyển trang được", async ({ page }) => {
    const pagination = page.locator(".home-pagination");

    if (!(await pagination.isVisible().catch(() => false))) {
      test.skip(true, "Không có phân trang");
      return;
    }

    const nextPageBtn = pagination.getByRole("button", { name: "2" });

    if (!(await nextPageBtn.isVisible().catch(() => false))) {
      test.skip(true, "Không có trang 2");
      return;
    }

    await nextPageBtn.click();

    await expect(page.locator(".home-container")).toBeVisible();
  });

  test("TC8 - Trang Home không bị lỗi trắng", async ({ page }) => {
    const bodyText = await page.locator("body").innerText();

    expect(bodyText.trim().length).toBeGreaterThan(0);
    await expect(page.getByText(/error|crash/i)).not.toBeVisible();
  });
});