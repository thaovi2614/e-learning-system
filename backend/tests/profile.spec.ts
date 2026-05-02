import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('TEST LUỒNG THÔNG TIN CÁ NHÂN', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);

    await page.getByPlaceholder('Tên đăng nhập').fill('u1');
    await page.getByPlaceholder('Mật khẩu').fill('1234');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('TC1 - Mở trang Profile hiển thị tiêu đề', async ({ page }) => {
    await page.goto(`${BASE}/profile`);

    await expect(page.getByRole('heading', { name: /thông tin cá nhân/i })).toBeVisible();
  });

  test('TC2 - Hiển thị thông tin email, username và vai trò', async ({ page }) => {
    await page.goto(`${BASE}/profile`);

    await expect(page.getByText(/email:/i)).toBeVisible();
    await expect(page.getByText(/tên người dùng:/i)).toBeVisible();
    await expect(page.getByText(/vai trò:/i)).toBeVisible();
  });

  test('TC3 - Hiển thị avatar và nút chọn ảnh mới', async ({ page }) => {
    await page.goto(`${BASE}/profile`);

    await expect(page.locator('.avatar-section img')).toBeVisible();
    await expect(page.getByText(/chọn ảnh mới/i)).toBeVisible();
  });

  test('TC4 - Hiển thị form đổi mật khẩu', async ({ page }) => {
    await page.goto(`${BASE}/profile`);

    await expect(page.getByRole('heading', { name: /đổi mật khẩu/i })).toBeVisible();
    await expect(page.getByPlaceholder('Mật khẩu cũ')).toBeVisible();
    await expect(page.getByPlaceholder('Mật khẩu mới')).toBeVisible();
    await expect(page.getByRole('button', { name: /cập nhật mật khẩu/i })).toBeVisible();
  });

  test('TC5 - Không nhập mật khẩu thì form không submit được', async ({ page }) => {
    await page.goto(`${BASE}/profile`);

    await page.getByRole('button', { name: /cập nhật mật khẩu/i }).click();

    await expect(page).toHaveURL(/\/profile/);
  });

  test('TC6 - Nhập sai mật khẩu cũ thì hiện alert lỗi', async ({ page }) => {
    let alertMessage = '';

    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.goto(`${BASE}/profile`);

    await page.getByPlaceholder('Mật khẩu cũ').fill('sai123');
    await page.getByPlaceholder('Mật khẩu mới').fill('123456');
    await page.getByRole('button', { name: /cập nhật mật khẩu/i }).click();

    await expect.poll(() => alertMessage).not.toBe('');
  });

  test('TC7 - Có input upload ảnh đại diện', async ({ page }) => {
    await page.goto(`${BASE}/profile`);

    await expect(page.locator('input[type="file"][accept="image/*"]')).toHaveCount(1);
  });
});