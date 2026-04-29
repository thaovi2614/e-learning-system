import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

// Slug thực tế lấy từ URL trên trình duyệt
const VALID_SLUG = 'ai-&-cong-nghe';       // có khóa học
const INVALID_SLUG = 'danh-muc-khong-ton-tai-xyz'; // không tồn tại
const ANOTHER_SLUG = 'marketing-&-bán-hàng';     // slug khác để test TC7 (thay bằng slug thực tế)        

test.describe('Trang Danh Mục (CategoryPage)', () => {

    // ─────────────────────────────────────────────
    // TC1: Hiển thị tên danh mục đúng
    // ─────────────────────────────────────────────
    test('TC1 - Hiển thị tên danh mục đúng', async ({ page }) => {
        await page.goto(`${BASE}/${VALID_SLUG}`);

        const heading = page.locator('h2.section-title');

        // Chờ heading có nội dung (API trả về xong)
        await expect(heading).not.toBeEmpty({ timeout: 8000 });

        const text = await heading.innerText();
        expect(text.trim().length).toBeGreaterThan(0);
    });

    // ─────────────────────────────────────────────
    // TC2: Hiển thị danh sách khóa học
    // ─────────────────────────────────────────────
    test('TC2 - Hiển thị danh sách khóa học của danh mục', async ({ page }) => {
        await page.goto(`${BASE}/${VALID_SLUG}`);

        await page.waitForTimeout(2000);

        const courses = page.locator('.course-item, .course-card, [class*="course"]');
        const count = await courses.count();

        expect(count).toBeGreaterThan(0);
    });

    // ─────────────────────────────────────────────
    // TC3: Danh mục không tồn tại -> hiện thông báo trống
    // ─────────────────────────────────────────────
    test('TC3 - Danh mục trống hiện thông báo không có khóa học', async ({ page }) => {
        await page.goto(`${BASE}/${INVALID_SLUG}`);

        await page.waitForTimeout(2000);

        await expect(page.getByText(/không có khóa học/i)).toBeVisible();
    });

    // ─────────────────────────────────────────────
    // TC4: Phân trang hiển thị đúng
    // ─────────────────────────────────────────────
    test('TC4 - Phân trang hiển thị khi có nhiều trang', async ({ page }) => {
        await page.goto(`${BASE}/${VALID_SLUG}`);

        await page.waitForTimeout(2000);

        // Nút số trang "2" phải visible
        await expect(page.getByRole('button', { name: '2' })).toBeVisible();
        // Nút next »
        await expect(page.getByRole('button', { name: '»' })).toBeVisible();
    });

    // ─────────────────────────────────────────────
    // TC5: Click trang 2 -> load khóa học mới
   
    test('TC5 - Click trang 2 load khóa học mới', async ({ page }) => {
        await page.goto(`${BASE}/${VALID_SLUG}`);
        await page.waitForTimeout(2000);

        // Lấy tên khóa học đầu tiên trang 1 - dùng selector chính xác
        const firstTitle = await page.locator('.course-card .course-content h3').first().innerText();

        // Click nút trang 2
        await page.getByRole('button', { name: '2' }).click();
        await page.waitForTimeout(2000);

        const newTitle = await page.locator('.course-card .course-content h3').first().innerText();
        expect(newTitle).not.toBe(firstTitle);
    });

    // ─────────────────────────────────────────────
    // TC6: Click vào khóa học -> chuyển sang trang chi tiết
    // ─────────────────────────────────────────────
    test('TC6 - Click vào khóa học chuyển sang trang chi tiết', async ({ page }) => {
        await page.goto(`${BASE}/${VALID_SLUG}`);
        await page.waitForTimeout(2000);

        // Click vào card khóa học đầu tiên
        await page.locator('.course-item, .course-card, [class*="course"]').first().click();

        await expect(page).toHaveURL(/\/courses\/\d+/, { timeout: 5000 });
    });

    // ─────────────────────────────────────────────
    // TC7: Điều hướng sang slug khác -> load đúng danh mục mới
    // ─────────────────────────────────────────────
    test('TC7 - Điều hướng sang slug khác load danh mục mới', async ({ page }) => {
        await page.goto(`${BASE}/${VALID_SLUG}`);

        // Chờ heading load xong
        await expect(page.locator('h2.section-title')).not.toBeEmpty({ timeout: 8000 });
        const firstHeading = await page.locator('h2.section-title').innerText();

        // Sang slug khác
        await page.goto(`${BASE}/${ANOTHER_SLUG}`);
        await expect(page.locator('h2.section-title')).not.toBeEmpty({ timeout: 8000 });
        const newHeading = await page.locator('h2.section-title').innerText();

        expect(newHeading.trim()).not.toBe(firstHeading.trim());
    });

});