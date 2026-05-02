import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5173';
const COURSE_ID = 3; // Thay bằng ID khóa học thực tế của instructor1

async function loginInstructor(page: Page) {
    await page.goto(`${BASE}/login`);
    await page.locator('input[name="username"]').fill('instructor1');
    await page.locator('input[name="password"]').fill('1234');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
}

test.describe('Quản Lý Nội Dung Bài Học (CourseContentPage)', () => {

    test.beforeEach(async ({ page }) => {
        await loginInstructor(page);
        await page.goto(`${BASE}/manage-course-content/${COURSE_ID}`);
        await page.waitForTimeout(2000);
    });

    // ─────────────────────────────────────────────
    // TC1: Giao diện hiển thị đầy đủ
    // ─────────────────────────────────────────────
    test('TC1 - Hiển thị đầy đủ giao diện trang', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /quản lý nội dung bài học/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /quay lại khóa học/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /thêm chương/i })).toBeVisible();

        // 3 tab
        await expect(page.getByRole('button', { name: /^slide$/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /^video$/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /^bài tập$/i })).toBeVisible();
    });

    // ─────────────────────────────────────────────
    // TC2: Hiển thị danh sách chương
    // ─────────────────────────────────────────────
    test('TC2 - Hiển thị danh sách chương của khóa học', async ({ page }) => {
        const chapters = page.locator('[style*="border"][style*="radius"]').filter({ hasText: /chương/i });
        const count = await chapters.count();

        if (count === 0) {
            await expect(page.getByText(/chưa có chương nào/i)).toBeVisible();
        } else {
            expect(count).toBeGreaterThan(0);
        }
    });

    // ─────────────────────────────────────────────
    // TC3: Mở form thêm chương
    // ─────────────────────────────────────────────
    test('TC3 - Bấm Thêm chương mở form', async ({ page }) => {
        await page.getByRole('button', { name: /thêm chương/i }).click();

        await expect(page.getByPlaceholder(/tên chương/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /^lưu$/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /^hủy$/i })).toBeVisible();
    });

    // ─────────────────────────────────────────────
    // TC4: Thêm chương thành công
    // ─────────────────────────────────────────────
    test('TC4 - Thêm chương mới thành công', async ({ page }) => {
        page.on('dialog', async (dialog) => {
            expect(dialog.message()).toMatch(/thêm chương thành công/i);
            await dialog.accept();
        });

        await page.getByRole('button', { name: /thêm chương/i }).click();
        await page.getByPlaceholder(/tên chương/i).fill(`Chương Test ${Date.now()}`);
        await page.getByRole('button', { name: /^lưu$/i }).click();

        await page.waitForTimeout(1500);

        // Form phải đóng lại
        await expect(page.getByPlaceholder(/tên chương/i)).not.toBeVisible({ timeout: 3000 });
    });

    // ─────────────────────────────────────────────
    // TC5: Thêm chương tên rỗng -> alert lỗi
    // ─────────────────────────────────────────────
    test('TC5 - Thêm chương tên rỗng hiện alert lỗi', async ({ page }) => {
        page.on('dialog', async (dialog) => {
            expect(dialog.message()).toMatch(/tên chương không được để trống/i);
            await dialog.accept();
        });

        await page.getByRole('button', { name: /thêm chương/i }).click();
        await page.getByRole('button', { name: /^lưu$/i }).click();
    });

    // ─────────────────────────────────────────────
    // TC6: Bấm Hủy đóng form chương
    // ─────────────────────────────────────────────
    test('TC6 - Bấm Hủy đóng form thêm chương', async ({ page }) => {
        await page.getByRole('button', { name: /thêm chương/i }).click();
        await expect(page.getByPlaceholder(/tên chương/i)).toBeVisible();

        await page.getByRole('button', { name: /^hủy$/i }).click();
        await expect(page.getByPlaceholder(/tên chương/i)).not.toBeVisible();
    });

    // ─────────────────────────────────────────────
    // TC7: Click chương -> hiển thị nội dung chương đó
    // ─────────────────────────────────────────────
    test('TC7 - Click chương hiển thị nội dung bên phải', async ({ page }) => {
        // Lấy chương đầu tiên
        const chapterItem = page.locator('div').filter({ hasText: /^Chương \d+:/ }).first();
        const count = await chapterItem.count();

        if (count === 0) {
            test.skip();
            return;
        }

        await chapterItem.click();
        await page.waitForTimeout(500);

        // Panel phải hiển thị "Nội dung: Chương..."
        await expect(page.getByText(/nội dung:.*chương/i)).toBeVisible();
    });

    // ─────────────────────────────────────────────
    // TC8: Chuyển tab Slide / Video / Bài tập
    // ─────────────────────────────────────────────
    test('TC8 - Chuyển tab Slide Video Bài tập', async ({ page }) => {
        await page.getByRole('button', { name: /^video$/i }).click();
        await expect(page.getByRole('button', { name: /thêm video/i })).toBeVisible();

        await page.getByRole('button', { name: /^bài tập$/i }).click();
        await expect(page.getByRole('button', { name: /thêm bài tập/i })).toBeVisible();

        await page.getByRole('button', { name: /^slide$/i }).click();
        await expect(page.getByRole('button', { name: /thêm slide/i })).toBeVisible();
    });

    // ─────────────────────────────────────────────
    // TC9: Mở form thêm nội dung (lesson)
    // ─────────────────────────────────────────────
    test('TC9 - Bấm Thêm slide mở form thêm nội dung', async ({ page }) => {
        await page.getByRole('button', { name: /thêm slide/i }).click();

        await expect(page.getByPlaceholder(/tên nội dung/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /lưu nội dung/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /^hủy$/i })).toBeVisible();
    });

    // ─────────────────────────────────────────────
    // TC10: Thêm lesson tên rỗng -> alert lỗi
    // ─────────────────────────────────────────────
    test('TC10 - Thêm nội dung tên rỗng hiện alert lỗi', async ({ page }) => {
        page.on('dialog', async (dialog) => {
            expect(dialog.message()).toMatch(/tên nội dung không được để trống/i);
            await dialog.accept();
        });

        await page.getByRole('button', { name: /thêm slide/i }).click();
        await page.getByRole('button', { name: /lưu nội dung/i }).click();
    });

    // ─────────────────────────────────────────────
    // TC11: Bấm Hủy đóng form lesson
    // ─────────────────────────────────────────────
    test('TC11 - Bấm Hủy đóng form thêm nội dung', async ({ page }) => {
        await page.getByRole('button', { name: /thêm slide/i }).click();
        await expect(page.getByPlaceholder(/tên nội dung/i)).toBeVisible();

        await page.getByRole('button', { name: /^hủy$/i }).click();
        await expect(page.getByPlaceholder(/tên nội dung/i)).not.toBeVisible();
    });

    
    // ─────────────────────────────────────────────
    // TC12: Bấm Quay lại -> về trang quản lý khóa học
    // ─────────────────────────────────────────────
    test('TC12 - Bấm Quay lại chuyển về trang quản lý khóa học', async ({ page }) => {
        await page.getByRole('button', { name: /quay lại khóa học/i }).click();
        await expect(page).toHaveURL(`${BASE}/manage-course`, { timeout: 5000 });
    });

});