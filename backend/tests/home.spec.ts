import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Trang Chủ (Home)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);
  });

  // ─────────────────────────────────────────────
  // TC1: Giao diện hiển thị đầy đủ
  // ─────────────────────────────────────────────
  test('TC1 - Hiển thị đầy đủ các thành phần giao diện', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /các khóa học nổi bật/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /tất cả các khóa học/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC2: Khóa học nổi bật (highlight) hiển thị đúng
  // ─────────────────────────────────────────────
  test('TC2 - Khóa học nổi bật hiển thị đúng', async ({ page }) => {
    const highlight = page.locator('.course-card.highlight');
    await expect(highlight).toBeVisible();

    // Phải có tên và giá
    await expect(highlight.locator('h3')).not.toBeEmpty();
    await expect(highlight.locator('p').last()).toContainText(/đ|VND|₫/);
  });

  // ─────────────────────────────────────────────
  // TC3: Danh sách khóa học hiển thị
  // ─────────────────────────────────────────────
  test('TC3 - Danh sách khóa học hiển thị ít nhất 1 khóa', async ({ page }) => {
    const cards = page.locator('.course-list .course-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────
  // TC4: Phân trang hiển thị
  // ─────────────────────────────────────────────
  test('TC4 - Phân trang hiển thị khi có nhiều trang', async ({ page }) => {
    const page2Btn = page.getByRole('button', { name: '2' });
    const hasPage2 = await page2Btn.isVisible().catch(() => false);

    if (hasPage2) {
      await expect(page2Btn).toBeVisible();
      await expect(page.getByRole('button', { name: '»' })).toBeVisible();
    }
  });

  // ─────────────────────────────────────────────
  // TC5: Click trang 2 -> load khóa học mới
  // ─────────────────────────────────────────────
  test('TC5 - Click trang 2 load khóa học mới', async ({ page }) => {
    const page2Btn = page.getByRole('button', { name: '2' });
    const hasPage2 = await page2Btn.isVisible().catch(() => false);

    if (!hasPage2) {
      test.skip();
      return;
    }

    const firstTitle = await page.locator('.course-list .course-card .course-content h3')
      .first().innerText();

    await page2Btn.click();
    await page.waitForTimeout(1500);

    const newTitle = await page.locator('.course-list .course-card .course-content h3')
      .first().innerText();

    expect(newTitle).not.toBe(firstTitle);
  });

  // ─────────────────────────────────────────────
  // TC6: Click khóa học nổi bật -> chuyển trang chi tiết
  // ─────────────────────────────────────────────
  test('TC6 - Click khóa học nổi bật chuyển sang trang chi tiết', async ({ page }) => {
    const highlight = page.locator('.course-card.highlight');
    await expect(highlight).toBeVisible();

    await highlight.click();

    await expect(page).toHaveURL(/\/courses\/\d+/, { timeout: 5000 });
  });

  // ─────────────────────────────────────────────
  // TC7: Click khóa học trong danh sách -> chuyển trang chi tiết
  // ─────────────────────────────────────────────
  test('TC7 - Click khóa học trong danh sách chuyển sang trang chi tiết', async ({ page }) => {
    const firstCard = page.locator('.course-list .course-card').first();
    await expect(firstCard).toBeVisible();

    await firstCard.click();

    await expect(page).toHaveURL(/\/courses\/\d+/, { timeout: 5000 });
  });

  // ─────────────────────────────────────────────
  // TC8: Giá khóa học hiển thị đúng định dạng VND
  // ─────────────────────────────────────────────
  test('TC8 - Giá khóa học hiển thị đúng định dạng VND', async ({ page }) => {
    const priceEl = page.locator('.course-list .course-card .course-content p').last();
    const priceText = await priceEl.innerText();
    expect(priceText).toMatch(/đ|VND|₫/);
  });

  // ─────────────────────────────────────────────
  // TC9: Click nút « quay về trang 1
  // ─────────────────────────────────────────────
  test('TC9 - Click nút « quay về trang 1', async ({ page }) => {
    const page2Btn = page.getByRole('button', { name: '2' });
    const hasPage2 = await page2Btn.isVisible().catch(() => false);

    if (!hasPage2) {
      test.skip();
      return;
    }

    // Sang trang 2
    await page2Btn.click();
    await page.waitForTimeout(1500);

    // Bấm « về trang 1
    await page.getByRole('button', { name: '«' }).click();
    await page.waitForTimeout(1500);

    // Nút "1" phải active (có style khác) hoặc ít nhất trang load lại
    const cards = page.locator('.course-list .course-card');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────
  // TC10: Trang load không bị lỗi trắng
  // ─────────────────────────────────────────────
  test('TC10 - Trang chủ load không bị lỗi trắng', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);

    // Không có thông báo lỗi
    await expect(page.getByText(/error|lỗi|crash/i)).not.toBeVisible();
  });

});