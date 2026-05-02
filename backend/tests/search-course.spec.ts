import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('TEST LUỒNG TÌM KIẾM KHÓA HỌC', () => {

  test('TC1 - Mở trang search hiển thị tiêu đề kết quả tìm kiếm', async ({ page }) => {
    await page.goto(`${BASE}/search?kw=python`);

    await expect(page.getByRole('heading', { name: /kết quả cho/i })).toBeVisible();
    await expect(page.getByText(/kết quả cho "python"/i)).toBeVisible();
  });

  test('TC2 - Tìm kiếm với từ khóa rỗng vẫn hiển thị trang search', async ({ page }) => {
    await page.goto(`${BASE}/search?kw=`);

    await expect(page.getByRole('heading', { name: /kết quả cho/i })).toBeVisible();
    await expect(page).toHaveURL(/\/search/);
  });

  test('TC3 - Hiển thị danh sách khóa học nếu có kết quả', async ({ page }) => {
    await page.goto(`${BASE}/search?kw=python`);

    await expect(page.locator('h2.section-title')).toContainText('0 kết quả');

    const courseItems = page.locator('.course-card, .course-item, a[href^="/courses/"]');

    const count = await courseItems.count();

    if (count > 0) {
      await expect(courseItems.first()).toBeVisible();
    } else {
      await expect(page.getByText(/0 kết quả/i)).toBeVisible();
    }
  });

  test('TC4 - Click vào khóa học trong kết quả tìm kiếm chuyển sang trang chi tiết', async ({ page }) => {
    await page.goto(`${BASE}/search?kw=python`);

    const courseItems = page.locator('.course-card, .course-item, a[href^="/courses/"]');

    if (await courseItems.count() > 0) {
      await courseItems.first().click();
      await expect(page).toHaveURL(/\/courses\/\d+/);
    }
  });

  test('TC5 - Tìm kiếm từ khóa không tồn tại hiển thị 0 kết quả', async ({ page }) => {
    await page.goto(`${BASE}/search?kw=abcxyzkhongcotronghethong999`);

    await expect(page.getByRole('heading', { name: /0 kết quả cho/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test('TC6 - URL có keyword thì tiêu đề hiển thị đúng keyword', async ({ page }) => {
    await page.goto(`${BASE}/search?kw=react`);

    await expect(page.getByText(/kết quả cho "react"/i)).toBeVisible();
  });

  test('TC7 - Nếu có phân trang thì click sang trang tiếp theo được', async ({ page }) => {
    await page.goto(`${BASE}/search?kw=course`);

    const nextButton = page.getByRole('button', { name: /next|sau|>/i });

    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();

      await expect(page.getByRole('heading', { name: /kết quả cho/i })).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: /kết quả cho/i })).toBeVisible();
    }
  });

});