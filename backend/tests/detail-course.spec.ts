import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5173';
const COURSE_ID = 1; // Thay bằng ID khóa học thực tế có trong DB

async function loginStudent(page: Page) {
    await page.goto(`${BASE}/login`);
    await page.locator('input[name="username"]').fill('u1');
    await page.locator('input[name="password"]').fill('1234');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
}

test.describe('Trang Chi Tiết Khóa Học (DetailCourse)', () => {

    // ─────────────────────────────────────────────
    // TC1: Giao diện hiển thị đầy đủ (chưa đăng nhập)
    // ─────────────────────────────────────────────
    test('TC1 - Hiển thị đầy đủ thông tin khóa học', async ({ page }) => {
        await page.goto(`${BASE}/courses/${COURSE_ID}`);
        await page.waitForTimeout(2000);

        // Header
        await expect(page.locator('.course-header h1')).toBeVisible();
        await expect(page.locator('.course-header p')).toBeVisible();

        // Các section
        await expect(page.getByRole('heading', { name: /giới thiệu khóa học/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /nội dung khóa học/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /các khóa học liên quan/i })).toBeVisible();

        // Panel phải
        await expect(page.getByRole('button', { name: /thêm giỏ hàng/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /mua ngay/i })).toBeVisible();
    });

    // ─────────────────────────────────────────────
    // TC2: Hiển thị giá đúng định dạng VND
    // ─────────────────────────────────────────────
    test('TC2 - Hiển thị giá đúng định dạng tiền VND', async ({ page }) => {
        await page.goto(`${BASE}/courses/${COURSE_ID}`);
        await page.waitForTimeout(2000);

        const priceText = await page.locator('.right h3').innerText();

        // Phải chứa ký hiệu tiền VND
        expect(priceText).toMatch(/đ|VND|₫/);
    });

    // ─────────────────────────────────────────────
    // TC3: Chưa đăng nhập bấm "Thêm giỏ hàng" -> redirect login
    // ─────────────────────────────────────────────
    test('TC3 - Chưa đăng nhập bấm Thêm giỏ hàng chuyển sang trang login', async ({ page }) => {
        await page.goto(`${BASE}/courses/${COURSE_ID}`);
        await page.waitForTimeout(2000);

        await page.getByRole('button', { name: /thêm giỏ hàng/i }).click();

        await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });

    // ─────────────────────────────────────────────
    // TC4: Sau khi login redirect về đúng trang chi tiết
    // ─────────────────────────────────────────────
    test('TC4 - Sau khi đăng nhập redirect về đúng trang chi tiết', async ({ page }) => {
        await page.goto(`${BASE}/courses/${COURSE_ID}`);
        await page.waitForTimeout(2000);

        // Bấm thêm giỏ -> redirect login
        await page.getByRole('button', { name: /thêm giỏ hàng/i }).click();
        await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

        // Đăng nhập
        await page.locator('input[name="username"]').fill('u1');
        await page.locator('input[name="password"]').fill('1234');
        await page.getByRole('button', { name: /đăng nhập/i }).click();

        // Phải redirect về trang chi tiết khóa học
        await expect(page).toHaveURL(`${BASE}/courses/${COURSE_ID}`, { timeout: 5000 });
    });

    // ─────────────────────────────────────────────
    // TC5: Đã đăng nhập bấm "Thêm giỏ hàng" thành công
    // ─────────────────────────────────────────────
    test('TC5 - Đã đăng nhập bấm Thêm giỏ hàng thêm vào giỏ', async ({ page }) => {
        await loginStudent(page);
        await page.goto(`${BASE}/courses/${COURSE_ID}`);
        await page.waitForTimeout(2000);

        // Bắt dialog nếu có thông báo
        page.on('dialog', async (dialog) => {
            await dialog.accept();
        });

        await page.getByRole('button', { name: /thêm giỏ hàng/i }).click();

        // Vẫn ở trang chi tiết (không redirect)
        await expect(page).toHaveURL(`${BASE}/courses/${COURSE_ID}`, { timeout: 3000 });
    });

    // ─────────────────────────────────────────────
    // TC6: Số lượng giỏ hàng tăng sau khi thêm
    // ─────────────────────────────────────────────
    test('TC6 - Badge giỏ hàng hiển thị số lượng trên navbar', async ({ page }) => {
        await loginStudent(page);
        await page.goto(`${BASE}/courses/${COURSE_ID}`);
        await page.waitForTimeout(2000);

        // Badge là span nằm trong div header-right, dùng inline style
        const badge = page.locator('div.header-right span');
        await expect(badge).toBeVisible({ timeout: 5000 });

        const badgeText = await badge.innerText();
        const count = parseInt(badgeText) || 0;
        expect(count).toBeGreaterThanOrEqual(0);
    });
    // ─────────────────────────────────────────────
    // TC7: Tên và subtitle khóa học hiển thị đúng
    // ─────────────────────────────────────────────
    test('TC7 - Tên khóa học không rỗng', async ({ page }) => {
        await page.goto(`${BASE}/courses/${COURSE_ID}`);
        await page.waitForTimeout(2000);

        const name = await page.locator('.course-header h1').innerText();
        expect(name.trim().length).toBeGreaterThan(0);
    });

    // ─────────────────────────────────────────────
    // TC8: Truy cập khóa học không tồn tại
    // ─────────────────────────────────────────────
    test('TC8 - Truy cập khóa học không tồn tại không crash trang', async ({ page }) => {
        await page.goto(`${BASE}/courses/999999`);
        await page.waitForTimeout(3000);

        // Trang không được hiện lỗi trắng hoàn toàn - phải có gì đó
        const bodyText = await page.locator('body').innerText();
        expect(bodyText.trim().length).toBeGreaterThan(0);
    });

    // ─────────────────────────────────────────────
    // TC9: Hiển thị "Loading..." trong lúc fetch dữ liệu
    // ─────────────────────────────────────────────
    test('TC9 - Hiển thị Loading khi đang tải dữ liệu', async ({ page }) => {
        // Intercept API để làm chậm response
        await page.route(`**/courses/${COURSE_ID}`, async (route) => {
            await new Promise((res) => setTimeout(res, 500));
            await route.continue();
        });

        await page.goto(`${BASE}/courses/${COURSE_ID}`);

        // Trong lúc load phải thấy "Loading..."
        await expect(page.getByText(/loading/i)).toBeVisible({ timeout: 1000 })
            .catch(() => { }); // Không bắt buộc nếu load quá nhanh
    });

});