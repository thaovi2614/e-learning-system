import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('TEST LUỒNG GIỎ HÀNG', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE}/login`);

        await page.getByPlaceholder('Tên đăng nhập').fill('u1');
        await page.getByPlaceholder('Mật khẩu').fill('1234');
        await page.getByRole('button', { name: /đăng nhập/i }).click();

        await expect(page).not.toHaveURL(/\/login/);
    });

    test('TC1_Mở trang giỏ hàng hiển thị đúng giao diện', async ({ page }) => {
        await page.goto(`${BASE}/cart`);

        await expect(page.getByRole('heading', { name: /giỏ hàng/i })).toBeVisible();
        await expect(page.getByText(/khóa học trong giỏ hàng/i)).toBeVisible();
        await expect(page.getByText(/tổng thanh toán/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /thanh toán/i })).toBeVisible();
    });


    test('TC2 - Giỏ hàng trống thì nút Thanh toán bị disable', async ({ page }) => {
        await page.goto(`${BASE}/cart`);

        const cartCount = await page.locator('.cart-card').count();
        if (cartCount > 0) {
            test.skip(); // Bỏ qua nếu giỏ không trống
            return;
        }

        await expect(page.getByRole('button', { name: /thanh toán/i })).toBeDisabled();
    });

    test('TC3_Nếu có khóa học trong giỏ thì hiển thị danh sách khóa học', async ({ page }) => {
        await page.goto(`${BASE}/cart`);

        const cartCountText = await page.locator('.quantity-item').innerText();

        if (!cartCountText.includes('0')) {
            await expect(page.locator('.cart-card').first()).toBeVisible();
            await expect(page.locator('.cart-card h3').first()).toBeVisible();
            await expect(page.getByRole('button', { name: /xóa/i }).first()).toBeVisible();
        }
    });

    test('TC4_Click Xóa khóa học khỏi giỏ hàng', async ({ page }) => {
        await page.goto(`${BASE}/cart`);

        const cartCards = page.locator('.cart-card');
        const countBefore = await cartCards.count();

        if (countBefore > 0) {
            await page.getByRole('button', { name: /xóa/i }).first().click();

            await expect(page.locator('.cart-card')).toHaveCount(countBefore - 1, {
                timeout: 5000,
            });
        }
    });

    test('TC5_Click Thanh toán khi có khóa học thì redirect sang MoMo/payment URL', async ({ page }) => {
        await page.goto(`${BASE}/cart`);

        const checkoutBtn = page.getByRole('button', { name: /thanh toán/i });

        if (await checkoutBtn.isEnabled()) {
            await checkoutBtn.click();

            await expect(page).not.toHaveURL(`${BASE}/cart`, { timeout: 10000 });
        }
    });
});