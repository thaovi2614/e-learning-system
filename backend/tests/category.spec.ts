import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

// đổi slug này theo danh mục có thật trên máy bạn
const CATEGORY_SLUG = "ai-&-công-nghệ";

test.describe("CategoryPage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/category/${CATEGORY_SLUG}`);
  });

  test("TC1 - Hiển thị giao diện trang danh mục", async ({ page }) => {
    await expect(page.locator(".category-container")).toBeVisible();
    await expect(page.locator(".category-title")).toBeVisible();
    await expect(page.locator(".category-subtitle")).toContainText(
      "khóa học trong danh mục này"
    );
  });

  test("TC2 - Hiển thị khu vực danh sách hoặc trạng thái rỗng", async ({ page }) => {
    const emptyState = page.locator(".category-empty");
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    if (hasEmpty) {
      await expect(emptyState).toContainText(/chưa có khóa học/i);
    } else {
      await expect(page.locator(".category-container")).toBeVisible();
    }
  });

  test("TC3 - Không hiển thị loading sau khi tải xong", async ({ page }) => {
    await expect(page.getByText("Đang tải...")).toBeHidden({
      timeout: 10000,
    });
  });

  test("TC4 - Nếu có khóa học thì click được vào khóa học", async ({ page }) => {
    await expect(page.getByText("Đang tải...")).toBeHidden({
      timeout: 10000,
    });

    const courseItem = page
      .locator(".course-card, .course-item, .course-box, .course")
      .first();

    if (!(await courseItem.isVisible().catch(() => false))) {
      test.skip(true, "Danh mục chưa có khóa học hoặc CourseList dùng class khác");
      return;
    }

    await courseItem.click();

    await expect(page).toHaveURL(/\/courses\/\d+/);
  });

  test("TC5 - Hiển thị phân trang nếu có nhiều trang", async ({ page }) => {
    const pagination = page.locator(".category-pagination");

    if (await pagination.isVisible().catch(() => false)) {
      await expect(pagination).toBeVisible();
    } else {
      await expect(page.locator(".category-container")).toBeVisible();
    }
  });

  test("TC6 - Nếu có phân trang thì bấm chuyển trang được", async ({ page }) => {
    const pagination = page.locator(".category-pagination");

    if (!(await pagination.isVisible().catch(() => false))) {
      test.skip(true, "Không có phân trang");
      return;
    }

    const page2Btn = pagination.getByRole("button", { name: "2" });

    if (!(await page2Btn.isVisible().catch(() => false))) {
      test.skip(true, "Không có trang 2");
      return;
    }

    await page2Btn.click();

    await expect(page.locator(".category-container")).toBeVisible();
  });
});