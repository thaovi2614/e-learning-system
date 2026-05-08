import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:5173";

async function loginAdmin(page: Page) {
  await page.goto(`${BASE}/login`);

  await page.getByPlaceholder(/tên đăng nhập/i).fill("admintest");
  await page.getByPlaceholder(/mật khẩu/i).fill("123456");

  await page.getByRole("button", { name: /đăng nhập/i }).click();

  await expect(page).not.toHaveURL(/\/login/);
}

test.describe("AdminCategory Page", () => {

  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);

    await page.goto(`${BASE}/admin/categories`);

    await expect(
      page.getByRole("heading", { name: /quản lý danh mục/i })
    ).toBeVisible();
  });

  // =========================
  // TC1
  // =========================
  test("TC1 - Hiển thị trang quản lý danh mục", async ({ page }) => {

    await expect(
      page.getByRole("heading", { name: /thêm danh mục mới/i })
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: /danh sách danh mục/i })
    ).toBeVisible();

    await expect(
      page.locator("table")
    ).toBeVisible();

  });

  // =========================
  // TC2
  // =========================
  test("TC2 - Thêm danh mục mới thành công", async ({ page }) => {

    const name = `Danh mục test ${Date.now()}`;

    await page
      .getByPlaceholder(/nhập tên danh mục/i)
      .fill(name);

    await page
      .getByRole("button", {
        name: /^thêm danh mục$/i,
      })
      .click();

    await page.waitForTimeout(2000);

    await expect(
      page.locator("tbody")
    ).toContainText(name);

  });

  // =========================
  // TC3
  // =========================
  test("TC3 - Chuyển sang form cập nhật khi bấm Sửa", async ({ page }) => {

    const firstRow = page.locator("tbody tr").first();

    await firstRow
      .getByRole("button", { name: /sửa/i })
      .click();

    await expect(
      page.getByRole("heading", {
        name: /cập nhật danh mục/i,
      })
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: /lưu thay đổi/i,
      })
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: /hủy/i,
      })
    ).toBeVisible();

  });

  // =========================
  // TC4
  // =========================
  test("TC4 - Sửa tên danh mục thành công", async ({ page }) => {

    const newName = `Danh mục sửa ${Date.now()}`;

    const firstRow = page.locator("tbody tr").first();

    await firstRow
      .getByRole("button", { name: /sửa/i })
      .click();

    await page
      .getByPlaceholder(/nhập tên danh mục/i)
      .fill(newName);

    await page
      .getByRole("button", {
        name: /lưu thay đổi/i,
      })
      .click();

    await page.waitForTimeout(2000);

    await expect(
      page.locator("tbody")
    ).toContainText(newName);

  });

  // =========================
  // TC5
  // =========================
  test("TC5 - Hủy cập nhật danh mục", async ({ page }) => {

    const firstRow = page.locator("tbody tr").first();

    await firstRow
      .getByRole("button", { name: /sửa/i })
      .click();

    await page
      .getByRole("button", { name: /hủy/i })
      .click();

    await expect(
      page.getByRole("heading", {
        name: /thêm danh mục mới/i,
      })
    ).toBeVisible();

  });
  
});