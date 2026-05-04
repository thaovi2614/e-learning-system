import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5173';
const COURSE_ID = 2; // Thay bằng ID khóa học mà "vi" đã đăng ký

async function loginUser(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.locator('input[name="username"]').fill('vi');
  await page.locator('input[name="password"]').fill('123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
}

test.describe('Trang Học Khóa Học (LearnCourse)', () => {

  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.goto(`${BASE}/learn/${COURSE_ID}`);
    await page.waitForTimeout(1500);
  });

  // ─────────────────────────────────────────────
  // TC1: Giao diện hiển thị đầy đủ
  // ─────────────────────────────────────────────
  test('TC1 - Hiển thị đầy đủ giao diện trang học', async ({ page }) => {
    await expect(page.locator('.learn-container')).toBeVisible();
    await expect(page.getByRole('button', { name: /← khóa học/i })).toBeVisible();
    await expect(page.locator('.tabs button', { hasText: /bài học/i })).toBeVisible();
    await expect(page.locator('.tabs button', { hasText: /diễn đàn/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC2: Mặc định hiển thị tab Bài học
  // ─────────────────────────────────────────────
  test('TC2 - Mặc định mở tab Bài học', async ({ page }) => {
    await expect(page.locator('.tabs button.active')).toContainText(/bài học/i);
    await expect(page.locator('.learn-sidebar')).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC3: Chuyển sang tab Diễn đàn
  // ─────────────────────────────────────────────
  test('TC3 - Click tab Diễn đàn chuyển sang diễn đàn', async ({ page }) => {
    await page.locator('.tabs button', { hasText: /diễn đàn/i }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('.tabs button.active')).toContainText(/diễn đàn/i);
    await expect(page.locator('.forum-container')).toBeVisible();
    await expect(page.getByRole('heading', { name: /diễn đàn/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC4: Chuyển lại tab Bài học từ Diễn đàn
  // ─────────────────────────────────────────────
  test('TC4 - Click lại tab Bài học từ Diễn đàn', async ({ page }) => {
    await page.locator('.tabs button', { hasText: /diễn đàn/i }).click();
    await page.waitForTimeout(300);

    await page.locator('.tabs button', { hasText: /bài học/i }).click();
    await page.waitForTimeout(300);

    await expect(page.locator('.tabs button.active')).toContainText(/bài học/i);
    await expect(page.locator('.learn-sidebar')).toBeVisible();
    await expect(page.locator('.forum-container')).not.toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC5: Bấm "← Khóa học" quay về my-courses
  // ─────────────────────────────────────────────
  test('TC5 - Bấm nút Khóa học quay về trang my-courses', async ({ page }) => {
    await page.getByRole('button', { name: /← khóa học/i }).click();
    await expect(page).toHaveURL(`${BASE}/my-courses`, { timeout: 5000 });
  });

  // ─────────────────────────────────────────────
  // TC6: Tab Bài học hiển thị đúng layout
  // ─────────────────────────────────────────────
  test('TC6 - Tab Bài học hiển thị sidebar và content', async ({ page }) => {
    await expect(page.locator('.learn-layout')).toBeVisible();
    await expect(page.locator('.learn-sidebar')).toBeVisible();
    await expect(page.locator('.learn-content')).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC7: Diễn đàn - đăng bài thành công
  // ─────────────────────────────────────────────
  test('TC7 - Diễn đàn đăng bài thành công', async ({ page }) => {
    await page.locator('.tabs button', { hasText: /diễn đàn/i }).click();
    await page.waitForTimeout(500);

    const content = `Câu hỏi test ${Date.now()}`;
    await page.getByPlaceholder(/viết câu hỏi/i).fill(content);
    await page.getByRole('button', { name: /^đăng$/i }).click();

    await expect(page.getByText(content)).toBeVisible({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────
  // TC8: Diễn đàn - textarea xóa trống sau khi đăng
  // ─────────────────────────────────────────────
  test('TC8 - Diễn đàn textarea trống sau khi đăng bài', async ({ page }) => {
    await page.locator('.tabs button', { hasText: /diễn đàn/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/viết câu hỏi/i).fill('Nội dung test');
    await page.getByRole('button', { name: /^đăng$/i }).click();

    await expect(page.getByPlaceholder(/viết câu hỏi/i)).toHaveValue('');
  });

  // ─────────────────────────────────────────────
  // TC9: Diễn đàn - không đăng bài trống
  // ─────────────────────────────────────────────
  test('TC9 - Diễn đàn không đăng được bài trống', async ({ page }) => {
    await page.locator('.tabs button', { hasText: /diễn đàn/i }).click();
    await page.waitForTimeout(500);

    const postsBefore = await page.locator('.post-item').count();
    await page.getByRole('button', { name: /^đăng$/i }).click();
    await page.waitForTimeout(300);

    const postsAfter = await page.locator('.post-item').count();
    expect(postsAfter).toBe(postsBefore);
  });

  // ─────────────────────────────────────────────
  // TC10: Trang không bị lỗi trắng
  // ─────────────────────────────────────────────
  test('TC10 - Trang học không bị lỗi trắng', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
    await expect(page.getByText(/error|crash/i)).not.toBeVisible();
  });

});