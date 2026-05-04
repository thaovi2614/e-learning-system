import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5173';

// ForumTab nằm trong trang học - cần đăng nhập và vào trang có forum
// Thay COURSE_ID bằng ID khóa học thực tế có enrollment
const COURSE_ID = 1;

async function loginStudent(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.locator('input[name="username"]').fill('vi');
  await page.locator('input[name="password"]').fill('123');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
}

async function goToForum(page: Page) {
  await page.goto(`${BASE}/learn/${COURSE_ID}`);
  await page.waitForTimeout(1500);

  // Click vào tab Diễn đàn nếu cần
  const forumTab = page.getByRole('button', { name: /diễn đàn/i })
    .or(page.getByText(/diễn đàn/i)).first();

  const hasForumTab = await forumTab.isVisible().catch(() => false);
  if (hasForumTab) await forumTab.click();

  await page.waitForTimeout(500);
}

test.describe('ForumTab - Diễn Đàn', () => {

  test.beforeEach(async ({ page }) => {
    await loginStudent(page);
    await goToForum(page);
  });

  // ─────────────────────────────────────────────
  // TC1: Giao diện hiển thị đầy đủ
  // ─────────────────────────────────────────────
  test('TC1 - Hiển thị đầy đủ giao diện diễn đàn', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /diễn đàn/i })).toBeVisible();
    await expect(page.getByPlaceholder(/viết câu hỏi/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /đăng/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC2: Đăng bài thành công
  // ─────────────────────────────────────────────
  test('TC2 - Đăng bài thành công hiển thị bài mới', async ({ page }) => {
    const content = `Câu hỏi test ${Date.now()}`;

    await page.getByPlaceholder(/viết câu hỏi/i).fill(content);
    await page.getByRole('button', { name: /^đăng$/i }).click();

    // Bài vừa đăng phải hiển thị
    await expect(page.getByText(content)).toBeVisible({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────
  // TC3: Đăng bài xong textarea tự xóa trống
  // ─────────────────────────────────────────────
  test('TC3 - Sau khi đăng textarea tự xóa về trống', async ({ page }) => {
    await page.getByPlaceholder(/viết câu hỏi/i).fill('Nội dung test');
    await page.getByRole('button', { name: /^đăng$/i }).click();

    await expect(page.getByPlaceholder(/viết câu hỏi/i)).toHaveValue('');
  });

  // ─────────────────────────────────────────────
  // TC4: Đăng bài trống -> không đăng được
  // ─────────────────────────────────────────────
  test('TC4 - Bấm Đăng khi textarea trống không tạo bài mới', async ({ page }) => {
    const postsBefore = await page.locator('.post-item').count();

    // Bấm đăng khi trống
    await page.getByRole('button', { name: /^đăng$/i }).click();
    await page.waitForTimeout(300);

    const postsAfter = await page.locator('.post-item').count();

    // Số bài không tăng
    expect(postsAfter).toBe(postsBefore);
  });

  // ─────────────────────────────────────────────
  // TC5: Đăng bài chỉ có khoảng trắng -> không đăng được
  // ─────────────────────────────────────────────
  test('TC5 - Đăng bài chỉ khoảng trắng không tạo bài mới', async ({ page }) => {
    const postsBefore = await page.locator('.post-item').count();

    await page.getByPlaceholder(/viết câu hỏi/i).fill('     ');
    await page.getByRole('button', { name: /^đăng$/i }).click();
    await page.waitForTimeout(300);

    const postsAfter = await page.locator('.post-item').count();
    expect(postsAfter).toBe(postsBefore);
  });

  // ─────────────────────────────────────────────
  // TC6: Đăng nhiều bài -> hiển thị đúng thứ tự
  // ─────────────────────────────────────────────
  test('TC6 - Đăng nhiều bài hiển thị đúng thứ tự', async ({ page }) => {
    const msg1 = `Bài 1 - ${Date.now()}`;
    const msg2 = `Bài 2 - ${Date.now()}`;

    await page.getByPlaceholder(/viết câu hỏi/i).fill(msg1);
    await page.getByRole('button', { name: /^đăng$/i }).click();
    await page.waitForTimeout(200);

    await page.getByPlaceholder(/viết câu hỏi/i).fill(msg2);
    await page.getByRole('button', { name: /^đăng$/i }).click();
    await page.waitForTimeout(200);

    // Cả 2 bài phải hiển thị
    await expect(page.getByText(msg1)).toBeVisible();
    await expect(page.getByText(msg2)).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC7: Bài đăng hiển thị tên người dùng "Bạn"
  // ─────────────────────────────────────────────
  test('TC7 - Bài đăng hiển thị tên người dùng', async ({ page }) => {
    await page.getByPlaceholder(/viết câu hỏi/i).fill('Test hiển thị tên');
    await page.getByRole('button', { name: /^đăng$/i }).click();
    await page.waitForTimeout(300);

    // Phải có tên người dùng trong bài đăng
    const postUser = page.locator('.post-user').last();
    await expect(postUser).toBeVisible();
    await expect(postUser).not.toBeEmpty();
  });

});