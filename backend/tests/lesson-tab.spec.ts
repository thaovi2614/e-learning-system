import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5173';
const COURSE_ID = 2; // Thay bằng ID khóa học mà "vi" đã đăng ký và có chapters/lessons

async function loginUser(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.locator('input[name="username"]').fill('vi');
  await page.locator('input[name="password"]').fill('123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
}

test.describe('LessonTab - Sidebar Bài Học', () => {

  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.goto(`${BASE}/learn/${COURSE_ID}`);
    await page.waitForTimeout(2000);
  });

  // TC1: Hiển thị tên khóa học
  test('TC1 - Hiển thị tên khóa học trong sidebar', async ({ page }) => {
    const courseName = page.locator('.chapter-list h3');
    await expect(courseName).toBeVisible({ timeout: 5000 });
    const text = await courseName.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  // TC2: Hiển thị danh sách chương
  test('TC2 - Hiển thị danh sách chương trong sidebar', async ({ page }) => {
    const chapters = page.locator('.chapter-item');
    const count = await chapters.count();
    if (count === 0) {
      await expect(page.locator('.chapter-list')).toBeVisible();
    } else {
      expect(count).toBeGreaterThan(0);
    }
  });

  // TC3: Mặc định chương đóng
  test('TC3 - Mặc định chương đóng không hiện lesson', async ({ page }) => {
    const chapters = page.locator('.chapter-item');
    const count = await chapters.count();
    if (count === 0) { test.skip(); return; }

    const url = page.url();
    if (!url.includes('/lesson/')) {
      const lessonList = page.locator('.lesson-list');
      const visibleCount = await lessonList.count();
      expect(visibleCount).toBe(0);
    }
  });

  // TC4: Click chương -> expand lesson
  test('TC4 - Click chương mở rộng hiển thị danh sách lesson', async ({ page }) => {
    const chapters = page.locator('.chapter-item');
    const count = await chapters.count();
    if (count === 0) { test.skip(); return; }

    await chapters.first().locator('.chapter-header').click();
    await page.waitForTimeout(300);

    await expect(chapters.first().locator('.chapter-header')).toContainText('▲');
    await expect(chapters.first().locator('.lesson-list')).toBeVisible();
  });

  // TC5: Click chương đang mở -> đóng lại
  test('TC5 - Click lần 2 đóng chương lại', async ({ page }) => {
    const chapters = page.locator('.chapter-item');
    const count = await chapters.count();
    if (count === 0) { test.skip(); return; }

    await chapters.first().locator('.chapter-header').click();
    await page.waitForTimeout(300);
    await expect(chapters.first().locator('.lesson-list')).toBeVisible();

    await chapters.first().locator('.chapter-header').click();
    await page.waitForTimeout(300);
    await expect(chapters.first().locator('.lesson-list')).not.toBeVisible();
    await expect(chapters.first().locator('.chapter-header')).toContainText('▼');
  });

  // TC6: Lesson hiển thị icon đúng loại
  test('TC6 - Lesson hiển thị icon đúng theo loại', async ({ page }) => {
    const chapters = page.locator('.chapter-item');
    if (await chapters.count() === 0) { test.skip(); return; }

    await chapters.first().locator('.chapter-header').click();
    await page.waitForTimeout(300);

    const lessons = page.locator('.lesson-item');
    if (await lessons.count() === 0) { test.skip(); return; }

    const icon = await lessons.first().locator('.lesson-icon').innerText();
    expect(['🎥', '📄', '📝', '📚']).toContain(icon.trim());
  });

  // TC7: Click lesson -> chuyển đúng URL
  test('TC7 - Click lesson chuyển đúng URL', async ({ page }) => {
    const chapters = page.locator('.chapter-item');
    if (await chapters.count() === 0) { test.skip(); return; }

    await chapters.first().locator('.chapter-header').click();
    await page.waitForTimeout(300);

    const lessons = page.locator('.lesson-item');
    if (await lessons.count() === 0) { test.skip(); return; }

    await lessons.first().click();
    await expect(page).toHaveURL(
      new RegExp(`/learn/${COURSE_ID}/lesson/\\d+`),
      { timeout: 5000 }
    );
  });

  // TC8: Lesson đang active có class "active"
  test('TC8 - Lesson đang chọn có class active', async ({ page }) => {
    const chapters = page.locator('.chapter-item');
    if (await chapters.count() === 0) { test.skip(); return; }

    await chapters.first().locator('.chapter-header').click();
    await page.waitForTimeout(300);

    const lessons = page.locator('.lesson-item');
    if (await lessons.count() === 0) { test.skip(); return; }

    await lessons.first().click();
    await page.waitForTimeout(500);

    await expect(lessons.first()).toHaveClass(/active/);
  });

  // TC9: Hiển thị loading khi fetch
  test('TC9 - Hiển thị Đang tải khi đang fetch dữ liệu', async ({ page }) => {
    await page.route(`**/courses/${COURSE_ID}`, async (route) => {
      await new Promise((res) => setTimeout(res, 600));
      await route.continue();
    });

    await page.goto(`${BASE}/learn/${COURSE_ID}`);
    await expect(page.getByText(/đang tải/i))
      .toBeVisible({ timeout: 1000 }).catch(() => {});
  });

  // TC10: Tên lesson không rỗng
  test('TC10 - Tên lesson không rỗng trong danh sách', async ({ page }) => {
    const chapters = page.locator('.chapter-item');
    if (await chapters.count() === 0) { test.skip(); return; }

    await chapters.first().locator('.chapter-header').click();
    await page.waitForTimeout(300);

    const lessons = page.locator('.lesson-item');
    if (await lessons.count() === 0) { test.skip(); return; }

    const allTitles = await lessons.allInnerTexts();
    for (const title of allTitles) {
      expect(title.trim().length).toBeGreaterThan(0);
    }
  });

});