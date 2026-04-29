import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5173';

// Helper: dùng name attribute thay vì placeholder để tránh strict mode violation
async function fillRegisterForm(page: Page, data: {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: 'STUDENT' | 'INSTRUCTOR';
}) {
  if (data.username)        await page.locator('input[name="username"]').fill(data.username);
  if (data.email)           await page.locator('input[name="email"]').fill(data.email);
  if (data.password)        await page.locator('input[name="password"]').fill(data.password);
  if (data.confirmPassword) await page.locator('input[name="confirmPassword"]').fill(data.confirmPassword);
  if (data.role === 'INSTRUCTOR') {
    // label che radio nên click vào label thay vì radio input
    await page.locator('label[for="INSTRUCTOR"]').click();
  }
}

function randomUser() {
  return `testuser_${Date.now()}`;
}

test.describe('Trang Đăng Ký', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/register`);
  });

  // ─────────────────────────────────────────────
  // TC1: Giao diện hiển thị đầy đủ
  // ─────────────────────────────────────────────
  test('TC1 - Hiển thị đầy đủ các thành phần giao diện', async ({ page }) => {
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('label[for="STUDENT"]')).toBeVisible();
    await expect(page.locator('label[for="INSTRUCTOR"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /đăng ký/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /đăng nhập ngay/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC2: Mặc định chọn vai trò Học viên
  // ─────────────────────────────────────────────
  test('TC2 - Mặc định chọn vai trò Học viên', async ({ page }) => {
    await expect(page.locator('input[type="radio"][value="STUDENT"]')).toBeChecked();
  });

  // ─────────────────────────────────────────────
  // TC3: Đăng ký thành công với vai trò STUDENT
  // ─────────────────────────────────────────────
  test('TC3 - Đăng ký thành công với vai trò STUDENT', async ({ page }) => {
    await fillRegisterForm(page, {
      username: randomUser(),
      email: `test_${Date.now()}@gmail.com`,
      password: '1234',
      confirmPassword: '1234',
      role: 'STUDENT',
    });

    await page.getByRole('button', { name: /đăng ký/i }).click();
    await expect(page).toHaveURL(`${BASE}/`, { timeout: 5000 });
  });

  // ─────────────────────────────────────────────
  // TC4: Đăng ký thành công với vai trò INSTRUCTOR
  // ─────────────────────────────────────────────
  test('TC4 - Đăng ký thành công với vai trò INSTRUCTOR', async ({ page }) => {
    await fillRegisterForm(page, {
      username: randomUser(),
      email: `instructor_${Date.now()}@gmail.com`,
      password: '1234',
      confirmPassword: '1234',
      role: 'INSTRUCTOR',
    });

    await page.getByRole('button', { name: /đăng ký/i }).click();
    await expect(page).toHaveURL(`${BASE}/`, { timeout: 5000 });
  });

  // ─────────────────────────────────────────────
  // TC5: Đăng ký username đã tồn tại -> báo lỗi
  // ─────────────────────────────────────────────
  test('TC5 - Đăng ký username đã tồn tại hiện lỗi', async ({ page }) => {
    await fillRegisterForm(page, {
      username: 'u1',
      email: `new_${Date.now()}@gmail.com`,
      password: '1234',
      confirmPassword: '1234',
    });

    await page.getByRole('button', { name: /đăng ký/i }).click();
    await expect(page).toHaveURL(`${BASE}/register`, { timeout: 5000 });
  });

  // ─────────────────────────────────────────────
  // TC6: Bỏ trống username -> không submit được
  // ─────────────────────────────────────────────
  test('TC6 - Bỏ trống username không submit được', async ({ page }) => {
    await fillRegisterForm(page, {
      email: 'test@gmail.com',
      password: '1234',
      confirmPassword: '1234',
    });

    await page.getByRole('button', { name: /đăng ký/i }).click();
    await expect(page).toHaveURL(`${BASE}/register`);
  });

  // ─────────────────────────────────────────────
  // TC7: Bỏ trống email -> không submit được
  // ─────────────────────────────────────────────
  test('TC7 - Bỏ trống email không submit được', async ({ page }) => {
    await fillRegisterForm(page, {
      username: randomUser(),
      password: '1234',
      confirmPassword: '1234',
    });

    await page.getByRole('button', { name: /đăng ký/i }).click();
    await expect(page).toHaveURL(`${BASE}/register`);
  });

  // ─────────────────────────────────────────────
  // TC8: Bỏ trống mật khẩu -> không submit được
  // ─────────────────────────────────────────────
  test('TC8 - Bỏ trống mật khẩu không submit được', async ({ page }) => {
    await fillRegisterForm(page, {
      username: randomUser(),
      email: 'test@gmail.com',
      confirmPassword: '1234',
    });

    await page.getByRole('button', { name: /đăng ký/i }).click();
    await expect(page).toHaveURL(`${BASE}/register`);
  });

  // ─────────────────────────────────────────────
  // TC9: Chọn vai trò Giảng viên
  // ─────────────────────────────────────────────
  test('TC9 - Chọn vai trò Giảng viên', async ({ page }) => {
    // Click vào label thay vì radio (label che radio input)
    await page.locator('label[for="INSTRUCTOR"]').click();

    await expect(page.locator('input[type="radio"][value="INSTRUCTOR"]')).toBeChecked();
    await expect(page.locator('input[type="radio"][value="STUDENT"]')).not.toBeChecked();
  });

  // ─────────────────────────────────────────────
  // TC10: Ẩn/hiện mật khẩu
  // ─────────────────────────────────────────────
  test('TC10 - Bấm icon mắt ẩn/hiện mật khẩu', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.locator('.input-icon-right').first().click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await page.locator('.input-icon-right').first().click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // ─────────────────────────────────────────────
  // TC11: Ẩn/hiện xác nhận mật khẩu
  // ─────────────────────────────────────────────
  test('TC11 - Bấm icon mắt ẩn/hiện xác nhận mật khẩu', async ({ page }) => {
    const confirmInput = page.locator('input[name="confirmPassword"]');
    await expect(confirmInput).toHaveAttribute('type', 'password');

    await page.locator('.input-icon-right').nth(1).click();
    await expect(confirmInput).toHaveAttribute('type', 'text');

    await page.locator('.input-icon-right').nth(1).click();
    await expect(confirmInput).toHaveAttribute('type', 'password');
  });

  // ─────────────────────────────────────────────
  // TC12: Click "Đăng nhập ngay" -> chuyển sang trang login
  // ─────────────────────────────────────────────
  test('TC12 - Click Đăng nhập ngay chuyển sang trang đăng nhập', async ({ page }) => {
    await page.getByRole('link', { name: /đăng nhập ngay/i }).click();
    await expect(page).toHaveURL(`${BASE}/login`, { timeout: 3000 });
  });

});