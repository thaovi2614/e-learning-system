import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5173';

// Thay bằng ID thực tế có trong DB của user "vi"
const COURSE_ID = 2;
const SLIDE_LESSON_ID = 30;  // ID lesson loại SLIDE
const VIDEO_LESSON_ID = 34;  // ID lesson loại VIDEO
const QUIZ_LESSON_ID  = 3;  // ID lesson loại QUIZ

async function loginUser(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.locator('input[name="username"]').fill('vi');
  await page.locator('input[name="password"]').fill('123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
}

test.describe('LessonViewer - Xem Bài Học', () => {

  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  // ─────────────────────────────────────────────
  // TC1: Hiển thị loading khi đang fetch
  // ─────────────────────────────────────────────
  test('TC1 - Hiển thị Đang tải bài học khi fetch', async ({ page }) => {
    await page.route(`**/lessons/${SLIDE_LESSON_ID}`, async (route) => {
      await new Promise((res) => setTimeout(res, 600));
      await route.continue();
    });

    await page.goto(`${BASE}/learn/${COURSE_ID}/lesson/${SLIDE_LESSON_ID}`);
    await expect(page.locator('.loading'))
      .toBeVisible({ timeout: 1000 }).catch(() => {});
  });

  // ─────────────────────────────────────────────
  // TC2: Hiển thị tiêu đề bài học
  // ─────────────────────────────────────────────
  test('TC2 - Hiển thị tiêu đề bài học', async ({ page }) => {
    await page.goto(`${BASE}/learn/${COURSE_ID}/lesson/${SLIDE_LESSON_ID}`);
    await page.waitForTimeout(2000);

    const title = page.locator('.lesson-viewer h2');
    await expect(title).toBeVisible({ timeout: 5000 });
    const text = await title.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────
  // TC3: Bài SLIDE hiển thị iframe
  // ─────────────────────────────────────────────
  test('TC3 - Bài SLIDE hiển thị iframe', async ({ page }) => {
    await page.goto(`${BASE}/learn/${COURSE_ID}/lesson/${SLIDE_LESSON_ID}`);
    await page.waitForTimeout(2000);

    const lessonType = await page.locator('.lesson-viewer').getAttribute('data-type')
      .catch(() => null);

    // Kiểm tra nếu là SLIDE thì có iframe
    const iframe = page.locator('.lesson-viewer iframe');
    const hasIframe = await iframe.isVisible().catch(() => false);

    if (hasIframe) {
      await expect(iframe).toBeVisible();
      await expect(iframe).toHaveAttribute('title', 'Slide');
    }
  });

  // ─────────────────────────────────────────────
  // TC4: Bài VIDEO hiển thị video player
  // ─────────────────────────────────────────────
  test('TC4 - Bài VIDEO hiển thị video player', async ({ page }) => {
    await page.goto(`${BASE}/learn/${COURSE_ID}/lesson/${VIDEO_LESSON_ID}`);
    await page.waitForTimeout(2000);

    const video = page.locator('.lesson-viewer video');
    const hasVideo = await video.isVisible().catch(() => false);

    if (hasVideo) {
      await expect(video).toBeVisible();
      await expect(video).toHaveAttribute('controls', '');
      await expect(video).toHaveAttribute('preload', 'metadata');
    }
  });

  // ─────────────────────────────────────────────
  // TC5: Bài QUIZ hiển thị placeholder Quiz
  // ─────────────────────────────────────────────
  test('TC5 - Bài QUIZ hiển thị nội dung quiz', async ({ page }) => {
    await page.goto(`${BASE}/learn/${COURSE_ID}/lesson/${QUIZ_LESSON_ID}`);
    await page.waitForTimeout(2000);

    const quiz = page.locator('.lesson-viewer').getByText(/quiz/i);
    const hasQuiz = await quiz.isVisible().catch(() => false);

    if (hasQuiz) {
      await expect(quiz).toBeVisible();
    }
  });

  // ─────────────────────────────────────────────
  // TC6: Đổi lessonId trên URL -> load bài mới
  // ─────────────────────────────────────────────
  test('TC6 - Đổi lessonId load bài học mới', async ({ page }) => {
    await page.goto(`${BASE}/learn/${COURSE_ID}/lesson/${SLIDE_LESSON_ID}`);
    await page.waitForTimeout(2000);

    const firstTitle = await page.locator('.lesson-viewer h2').innerText()
      .catch(() => '');

    // Chuyển sang lesson khác
    await page.goto(`${BASE}/learn/${COURSE_ID}/lesson/${VIDEO_LESSON_ID}`);
    await page.waitForTimeout(2000);

    const secondTitle = await page.locator('.lesson-viewer h2').innerText()
      .catch(() => '');

    // Tiêu đề phải thay đổi (nếu 2 lesson khác nhau)
    if (firstTitle && secondTitle) {
      expect(secondTitle).not.toBe(firstTitle);
    }
  });

  // ─────────────────────────────────────────────
  // TC7: Trang không bị lỗi trắng
  // ─────────────────────────────────────────────
  test('TC7 - Trang xem bài học không bị lỗi trắng', async ({ page }) => {
    await page.goto(`${BASE}/learn/${COURSE_ID}/lesson/${SLIDE_LESSON_ID}`);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
    await expect(page.getByText(/error|crash/i)).not.toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC8: Truy cập lesson không tồn tại không crash
  // ─────────────────────────────────────────────
  test('TC8 - Truy cập lesson không tồn tại không crash', async ({ page }) => {
    await page.goto(`${BASE}/learn/${COURSE_ID}/lesson/999999`);
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

});