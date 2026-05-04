import { test, expect, Page } from '@playwright/test';


const BASE = 'http://localhost:5173';
const COURSE_ID = 2;
const TEST_FILE = 'tests/upload/C1_Tong_quan.pdf';

async function loginInstructor(page: Page) {
    await page.goto(`${BASE}/login`);
    await page.getByPlaceholder('Tên đăng nhập').fill('instructor1');
    await page.getByPlaceholder('Mật khẩu').fill('1234');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).not.toHaveURL(/\/login/);
}

async function openCourseContent(page: Page) {
    await page.goto(`${BASE}/manage-course-content/${COURSE_ID}`);
    await expect(page.getByRole('heading', { name: /quản lý khóa học/i })).toBeVisible();
}

async function goContentTab(page: Page) {
    await page.getByRole('button', { name: /nội dung bài học/i }).click();
    await expect(page.getByText(/danh sách chương/i)).toBeVisible();
}

async function goForumTab(page: Page) {
    await page.getByRole('button', { name: /diễn đàn thảo luận/i }).click();
    await expect(page.getByRole('heading', { name: /^diễn đàn$/i })).toBeVisible();
}

async function ensureSlideLesson(page: Page) {
    await goContentTab(page);
    await page.getByRole('button', { name: /^slide$/i }).click();

    const editBtn = page.getByRole('button', { name: /^sửa$/i }).first();

    if (await editBtn.isVisible().catch(() => false)) {
        return;
    }

    await page.getByRole('button', { name: /\+ thêm slide/i }).click();
    await page.getByPlaceholder(/tên nội dung/i).fill(`Slide test ${Date.now()}`);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_FILE);

    page.once('dialog', async dialog => {
        await dialog.accept();
    });

    await page.getByRole('button', { name: /lưu nội dung/i }).click();

    await expect(page.getByRole('button', { name: /^sửa$/i }).first()).toBeVisible({
        timeout: 10000,
    });
}

test.describe('Quản Lý Nội Dung Bài Học (CourseContentPage v2)', () => {
    test.beforeEach(async ({ page }) => {
        await loginInstructor(page);
        await openCourseContent(page);
    });

    test('TC1 - Hiển thị đầy đủ giao diện trang', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /quản lý khóa học/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /nội dung bài học/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /diễn đàn thảo luận/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /quay lại khóa học/i })).toBeVisible();
    });

    test('TC2 - Mặc định tab Nội dung bài học được chọn', async ({ page }) => {
        await expect(page.getByText(/danh sách chương/i)).toBeVisible();
        await expect(page.getByText(/nội dung:/i)).toBeVisible();
    });

    test('TC3 - Click tab Diễn đàn hiển thị forum', async ({ page }) => {
        await goForumTab(page);

        await expect(page.getByPlaceholder(/viết câu hỏi/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /^đăng$/i })).toBeVisible();
        await expect(page.getByText(/danh sách câu hỏi/i)).toBeVisible();
    });

    test('TC4 - Click lại tab Nội dung ẩn forum hiện bài học', async ({ page }) => {
        await goForumTab(page);
        await goContentTab(page);

        await expect(page.getByText(/danh sách chương/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /\+ thêm chương/i })).toBeVisible();
    });

    test('TC5 - Diễn đàn đăng bài thành công', async ({ page }) => {
        await goForumTab(page);

        const content = `Câu hỏi test ${Date.now()}`;
        await page.getByPlaceholder(/viết câu hỏi/i).fill(content);

        await page.getByRole('button', { name: /^đăng$/i }).click();

        await expect(page.getByText(content)).toBeVisible({ timeout: 10000 });
    });

    test('TC6 - Diễn đàn không đăng được bài trống', async ({ page }) => {
        await goForumTab(page);

        const beforeCount = await page.locator('tbody tr').count();

        await page.getByPlaceholder(/viết câu hỏi/i).fill('   ');
        await page.getByRole('button', { name: /^đăng$/i }).click();

        await expect(page.locator('tbody tr')).toHaveCount(beforeCount);
    });

    test('TC7 - Diễn đàn hiển thị bài viết sau khi đăng', async ({ page }) => {
        await goForumTab(page);

        const content = `Test nội dung ${Date.now()}`;
        const textarea = page.getByPlaceholder(/viết câu hỏi/i);

        await textarea.fill(content);
        await page.getByRole('button', { name: /^đăng$/i }).click();

        await expect(page.getByText(content)).toBeVisible({ timeout: 10000 });
    });

    test('TC8 - Chuyển tab Slide Video Bài tập trong Nội dung', async ({ page }) => {
        await goContentTab(page);

        await page.getByRole('button', { name: /^slide$/i }).click();
        await expect(page.getByRole('button', { name: /\+ thêm slide/i })).toBeVisible();

        await page.getByRole('button', { name: /^video$/i }).click();
        await expect(page.getByRole('button', { name: /\+ thêm video/i })).toBeVisible();

        await page.getByRole('button', { name: /^bài tập$/i }).click();
        await expect(page.getByRole('button', { name: /\+ thêm bài tập/i })).toBeVisible();
    });

    test('TC9 - Thêm chương mới thành công', async ({ page }) => {
        await goContentTab(page);

        const chapterName = `Chương Test ${Date.now()}`;
        await page.getByRole('button', { name: /\+ thêm chương/i }).click();
        await page.getByPlaceholder(/tên chương/i).fill(chapterName);

        let alertText = '';
        page.once('dialog', async dialog => {
            alertText = dialog.message();
            await dialog.accept();
        });

        await page.getByRole('button', { name: /^lưu$/i }).click();

        await expect.poll(() => alertText, { timeout: 5000 }).toContain('Thêm chương thành công');
    });

    test('TC10 - Thêm chương tên rỗng hiện alert lỗi', async ({ page }) => {
        await goContentTab(page);

        await page.getByRole('button', { name: /\+ thêm chương/i }).click();

        let alertText = '';
        page.once('dialog', async dialog => {
            alertText = dialog.message();
            await dialog.accept();
        });

        await page.getByRole('button', { name: /^lưu$/i }).click();

        await expect.poll(() => alertText).toContain('Tên chương không được để trống');
    });

    test('TC11 - Bấm Sửa lesson mở form với tên điền sẵn', async ({ page }) => {
        await ensureSlideLesson(page);

        const editBtns = page.getByRole('button', { name: /^sửa$/i });
        await expect(editBtns.first()).toBeVisible({ timeout: 10000 });

        await editBtns.first().click();

        await expect(page.getByPlaceholder(/tên nội dung/i)).toBeVisible();
        await expect(page.getByPlaceholder(/tên nội dung/i)).not.toHaveValue('');
        await expect(page.getByRole('button', { name: /cập nhật nội dung/i })).toBeVisible();
    });

    test('TC12 - Bấm Xóa lesson hiện dialog xác nhận', async ({ page }) => {
        await ensureSlideLesson(page);

        const deleteBtns = page.getByRole('button', { name: /^xóa$/i });
        await expect(deleteBtns.first()).toBeVisible({ timeout: 10000 });

        let confirmText = '';
        page.once('dialog', async dialog => {
            confirmText = dialog.message();
            await dialog.dismiss();
        });

        await deleteBtns.first().click();

        await expect.poll(() => confirmText).toContain('Xác nhận xoá nội dung này');
    });

    test('TC13 - Bấm Quay lại về trang quản lý khóa học', async ({ page }) => {
        await page.getByRole('button', { name: /quay lại khóa học/i }).click();
        await expect(page).toHaveURL(/\/manage-course$/);
    });
});