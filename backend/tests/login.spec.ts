import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Trang Đăng Nhập', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
  });

  // ─────────────────────────────────────────────
  // TC1: Giao diện hiển thị đúng
  // ─────────────────────────────────────────────
  test('TC1 - Hiển thị đầy đủ các thành phần giao diện', async ({ page }) => {
    await expect(page.getByPlaceholder('Tên đăng nhập')).toBeVisible();
    await expect(page.getByPlaceholder('Mật khẩu')).toBeVisible();
    await expect(page.getByRole('button', { name: /đăng nhập/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /đăng ký ngay/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC2: Đăng nhập thành công với tài khoản STUDENT
  // ─────────────────────────────────────────────
  test('TC2 - Đăng nhập thành công với tài khoản STUDENT', async ({ page }) => {
    await page.getByPlaceholder('Tên đăng nhập').fill('u1');
    await page.getByPlaceholder('Mật khẩu').fill('1234');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Sau khi đăng nhập phải redirect về trang chủ
    await expect(page).toHaveURL(`${BASE}/`, { timeout: 5000 });
  });

  // ─────────────────────────────────────────────
  // TC3: Đăng nhập thành công với tài khoản INSTRUCTOR
  // ─────────────────────────────────────────────
  test('TC3 - Đăng nhập thành công với tài khoản INSTRUCTOR', async ({ page }) => {
    await page.getByPlaceholder('Tên đăng nhập').fill('instructor3');
    await page.getByPlaceholder('Mật khẩu').fill('1234');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    await expect(page).toHaveURL(`${BASE}/`, { timeout: 5000 });
  });

  // ─────────────────────────────────────────────
  // TC4: Đăng nhập sai mật khẩu -> hiện alert lỗi
  // ─────────────────────────────────────────────
  test('TC4 - Đăng nhập sai mật khẩu hiện thông báo lỗi', async ({ page }) => {
    // Bắt dialog alert
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toBeTruthy();
      await dialog.accept();
    });

    await page.getByPlaceholder('Tên đăng nhập').fill('u1');
    await page.getByPlaceholder('Mật khẩu').fill('saimatkhau');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Phải ở lại trang login
    await expect(page).toHaveURL(`${BASE}/login`, { timeout: 5000 });
  });

  // ─────────────────────────────────────────────
  // TC5: Đăng nhập với username không tồn tại
  // ─────────────────────────────────────────────
  test('TC5 - Đăng nhập với tài khoản không tồn tại', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toBeTruthy();
      await dialog.accept();
    });

    await page.getByPlaceholder('Tên đăng nhập').fill('khongtontai123');
    await page.getByPlaceholder('Mật khẩu').fill('1234');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    await expect(page).toHaveURL(`${BASE}/login`, { timeout: 5000 });
  });

  // ─────────────────────────────────────────────
  // TC6: Bỏ trống username -> không submit được
  // ─────────────────────────────────────────────
  test('TC6 - Bỏ trống username không submit được', async ({ page }) => {
    await page.getByPlaceholder('Mật khẩu').fill('1234');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Vẫn ở trang login vì có attribute required
    await expect(page).toHaveURL(`${BASE}/login`);
  });

  // ─────────────────────────────────────────────
  // TC7: Bỏ trống mật khẩu -> không submit được
  // ─────────────────────────────────────────────
  test('TC7 - Bỏ trống mật khẩu không submit được', async ({ page }) => {
    await page.getByPlaceholder('Tên đăng nhập').fill('u1');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    await expect(page).toHaveURL(`${BASE}/login`);
  });

  // ─────────────────────────────────────────────
  // TC8: Ẩn/hiện mật khẩu
  // ─────────────────────────────────────────────
  test('TC8 - Bấm icon mắt để hiện/ẩn mật khẩu', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Mật khẩu');

    // Ban đầu phải là type="password"
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Bấm icon mắt
    await page.locator('.input-icon-right').click();

    // Phải chuyển thành type="text"
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Bấm lại -> ẩn lại
    await page.locator('.input-icon-right').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // ─────────────────────────────────────────────
  // TC9: Click "Đăng ký ngay" -> chuyển sang trang register
  // ─────────────────────────────────────────────
  test('TC9 - Click Đăng ký ngay chuyển sang trang đăng ký', async ({ page }) => {
    await page.getByRole('link', { name: /đăng ký ngay/i }).click();
    await expect(page).toHaveURL(`${BASE}/register`, { timeout: 3000 });
  });

});