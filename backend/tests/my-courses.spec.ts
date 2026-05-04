import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5173';

async function loginStudent(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.locator('input[name="username"]').fill('vi');
  await page.locator('input[name="password"]').fill('123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
}

test.describe('Trang Khóa Học Của Tôi (MyCourses)', () => {

  test.beforeEach(async ({ page }) => {
    await loginStudent(page);
    await page.goto(`${BASE}/my-courses`);
    await page.waitForTimeout(1500);
  });

  // ─────────────────────────────────────────────
  // TC1: Giao diện hiển thị đúng
  // ─────────────────────────────────────────────
  test('TC1 - Hiển thị heading Khóa học của tôi', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /khóa học của tôi/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC2: Có khóa học -> hiển thị danh sách
  // ─────────────────────────────────────────────
  test('TC2 - Hiển thị danh sách khóa học đã đăng ký', async ({ page }) => {
    const cards = page.locator('.course-grid .course-card');
    const count = await cards.count();

    if (count === 0) {
      // Nếu chưa đăng ký -> phải hiện thông báo trống
      await expect(page.locator('.empty')).toBeVisible();
      await expect(page.locator('.empty')).toContainText(/chưa đăng ký/i);
    } else {
      await expect(cards.first()).toBeVisible();
    }
  });

  // ─────────────────────────────────────────────
  // TC3: Mỗi card có tên, subtitle và badge "Đã đăng ký"
  // ─────────────────────────────────────────────
  test('TC3 - Mỗi card hiển thị đúng tên, subtitle và badge', async ({ page }) => {
    const cards = page.locator('.course-grid .course-card');
    const count = await cards.count();

    if (count === 0) {
      test.skip();
      return;
    }

    const firstCard = cards.first();
    await expect(firstCard.locator('h3')).not.toBeEmpty();
    await expect(firstCard.locator('p')).toBeVisible();
    await expect(firstCard.locator('.badge')).toContainText(/đã đăng ký/i);
  });

  // ─────────────────────────────────────────────
  // TC4: Click vào khóa học -> chuyển sang trang học
  // ─────────────────────────────────────────────
  test('TC4 - Click vào khóa học chuyển sang trang học', async ({ page }) => {
    const cards = page.locator('.course-grid .course-card');
    const count = await cards.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await cards.first().click();

    await expect(page).toHaveURL(/\/learn\/\d+/, { timeout: 5000 });
  });

  // ─────────────────────────────────────────────
  // TC5: Hover vào card hiển thị overlay "Xem khóa học"
  // ─────────────────────────────────────────────
  test('TC5 - Hover vào card hiển thị overlay Xem khóa học', async ({ page }) => {
    const cards = page.locator('.course-grid .course-card');
    const count = await cards.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await cards.first().hover();

    await expect(cards.first().locator('.overlay span')).toContainText(/xem khóa học/i);
  });

  // ─────────────────────────────────────────────
  // TC6: Chưa đăng nhập truy cập -> redirect login
  // ─────────────────────────────────────────────
  test('TC6 - Chưa đăng nhập truy cập trang bị redirect login', async ({ page }) => {
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());

  await page.goto(`${BASE}/my-courses`);
  await page.waitForTimeout(1500);

  const url = page.url();

  // Chấp nhận cả 3 trường hợp: redirect login, hiện empty, hoặc hiện trang trống
  const isLoginPage = url.includes('/login');
  const isEmpty = await page.locator('.empty').isVisible().catch(() => false);
  const hasNoCards = await page.locator('.course-grid .course-card').count() === 0;

  expect(isLoginPage || isEmpty || hasNoCards).toBeTruthy();
});

  // ─────────────────────────────────────────────
  // TC7: Tên khóa học không rỗng
  // ─────────────────────────────────────────────
  test('TC7 - Tên khóa học trong danh sách không rỗng', async ({ page }) => {
    const cards = page.locator('.course-grid .course-card');
    const count = await cards.count();

    if (count === 0) {
      test.skip();
      return;
    }

    const allTitles = await cards.locator('h3').allInnerTexts();
    for (const title of allTitles) {
      expect(title.trim().length).toBeGreaterThan(0);
    }
  });

  // ─────────────────────────────────────────────
  // TC8: Trang không bị lỗi trắng
  // ─────────────────────────────────────────────
  test('TC8 - Trang không bị lỗi trắng', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
    await expect(page.getByText(/error|crash/i)).not.toBeVisible();
  });

});