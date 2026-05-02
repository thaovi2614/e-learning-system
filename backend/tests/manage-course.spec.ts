import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5173';

async function loginInstructor(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.locator('input[name="username"]').fill('instructor1');
  await page.locator('input[name="password"]').fill('1234');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
}

test.describe('Quản Lý Khóa Học - INSTRUCTOR', () => {

  test.beforeEach(async ({ page }) => {
    await loginInstructor(page);
    await page.goto(`${BASE}/manage-course`);
    await page.waitForTimeout(1500);
  });

  // ─────────────────────────────────────────────
  // TC1: Giao diện hiển thị đầy đủ
  // ─────────────────────────────────────────────
  test('TC1 - Hiển thị đầy đủ giao diện trang quản lý', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /quản lý khóa học/i })).toBeVisible();
    await expect(page.getByPlaceholder(/tìm kiếm khóa học/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /thêm khóa học/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /làm mới/i })).toBeVisible();
    await expect(page.getByText(/tổng khóa học/i)).toBeVisible();
    await expect(page.getByText(/đang hoạt động/i)).toBeVisible();
    await expect(page.getByText(/tạm ẩn/i)).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC2: Bảng hiển thị đúng các cột
  // ─────────────────────────────────────────────
  test('TC2 - Bảng danh sách khóa học có đủ các cột', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /tên khóa học/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /danh mục/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /giá/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /loại/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /trạng thái/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /thao tác/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC3: Thống kê tổng khóa học hiển thị số
  // ─────────────────────────────────────────────
  test('TC3 - Thống kê hiển thị số lượng khóa học', async ({ page }) => {
    const statNumbers = page.locator('h2');
    const count = await statNumbers.count();
    expect(count).toBeGreaterThanOrEqual(3); // 3 stat cards
  });

  // ─────────────────────────────────────────────
  // TC4: Tìm kiếm có kết quả
  // ─────────────────────────────────────────────
  test('TC4 - Tìm kiếm khóa học theo tên có kết quả', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const count = await rows.count();

    if (count === 0) { test.skip(); return; }

    const firstName = await rows.first().locator('b').innerText();
    const keyword = firstName.slice(0, 3); // Lấy 3 ký tự đầu để search

    await page.getByPlaceholder(/tìm kiếm khóa học/i).fill(keyword);
    await page.waitForTimeout(300);

    await expect(page.locator('tbody tr')).not.toHaveCount(0);
  });

  // ─────────────────────────────────────────────
  // TC5: Tìm kiếm không có kết quả
  // ─────────────────────────────────────────────
  test('TC5 - Tìm kiếm không có kết quả hiện thông báo', async ({ page }) => {
    await page.getByPlaceholder(/tìm kiếm khóa học/i).fill('xyzkhongtontai999abc');
    await page.waitForTimeout(300);

    await expect(page.getByText(/chưa có khóa học nào/i)).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC6: Bấm Làm mới xóa từ khóa tìm kiếm
  // ─────────────────────────────────────────────
  test('TC6 - Bấm Làm mới xóa từ khóa tìm kiếm', async ({ page }) => {
    await page.getByPlaceholder(/tìm kiếm khóa học/i).fill('test keyword');
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /làm mới/i }).click();
    await page.waitForTimeout(300);

    await expect(page.getByPlaceholder(/tìm kiếm khóa học/i)).toHaveValue('');
  });

  // ─────────────────────────────────────────────
  // TC7: Mở form thêm khóa học
  // ─────────────────────────────────────────────
  test('TC7 - Bấm Thêm khóa học mở modal form', async ({ page }) => {
    await page.getByRole('button', { name: /thêm khóa học/i }).click();

    await expect(page.getByRole('heading', { name: /thêm khóa học/i })).toBeVisible();
    await expect(page.getByPlaceholder(/tên khóa học/i)).toBeVisible();
    await expect(page.getByPlaceholder(/mô tả ngắn/i)).toBeVisible();
    await expect(page.getByPlaceholder(/giá/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /tạo khóa học/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^hủy$/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC8: Thiếu tên khóa học -> alert lỗi
  // ─────────────────────────────────────────────
  test('TC8 - Tạo khóa học thiếu tên hiện alert lỗi', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/tên khóa học không được để trống/i);
      await dialog.accept();
    });

    await page.getByRole('button', { name: /thêm khóa học/i }).click();
    await page.getByRole('button', { name: /tạo khóa học/i }).click();
  });

  // ─────────────────────────────────────────────
  // TC9: Thiếu subtitle -> alert lỗi
  // ─────────────────────────────────────────────
  test('TC9 - Tạo khóa học thiếu subtitle hiện alert lỗi', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/subtitle không được để trống/i);
      await dialog.accept();
    });

    await page.getByRole('button', { name: /thêm khóa học/i }).click();
    await page.getByPlaceholder(/tên khóa học/i).fill('Khóa học test');
    await page.getByRole('button', { name: /tạo khóa học/i }).click();
  });

  // ─────────────────────────────────────────────
  // TC10: Thiếu giá -> alert lỗi
  // ─────────────────────────────────────────────
  test('TC10 - Tạo khóa học thiếu giá hiện alert lỗi', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/giá không được để trống/i);
      await dialog.accept();
    });

    await page.getByRole('button', { name: /thêm khóa học/i }).click();
    await page.getByPlaceholder(/tên khóa học/i).fill('Khóa học test');
    await page.getByPlaceholder(/mô tả ngắn/i).fill('Subtitle test');
    await page.getByRole('button', { name: /tạo khóa học/i }).click();
  });

  // ─────────────────────────────────────────────
  // TC11: Thiếu danh mục -> alert lỗi
  // ─────────────────────────────────────────────
  test('TC11 - Tạo khóa học thiếu danh mục hiện alert lỗi', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/vui lòng chọn danh mục/i);
      await dialog.accept();
    });

    await page.getByRole('button', { name: /thêm khóa học/i }).click();
    await page.getByPlaceholder(/tên khóa học/i).fill('Khóa học test');
    await page.getByPlaceholder(/mô tả ngắn/i).fill('Subtitle test');
    await page.getByPlaceholder(/giá/i).fill('100000');
    await page.getByRole('button', { name: /tạo khóa học/i }).click();
  });

  // ─────────────────────────────────────────────
  // TC12: Tạo khóa học thành công
  // ─────────────────────────────────────────────
  test('TC12 - Tạo khóa học mới thành công', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/tạo khóa học thành công/i);
      await dialog.accept();
    });

    await page.getByRole('button', { name: /thêm khóa học/i }).click();
    await page.getByPlaceholder(/tên khóa học/i).fill(`Test Course ${Date.now()}`);
    await page.getByPlaceholder(/mô tả ngắn/i).fill('Subtitle test tự động');
    await page.getByPlaceholder(/giá/i).fill('100000');
    await page.locator('select[name="category_id"]').selectOption({ index: 1 });
    await page.getByRole('button', { name: /tạo khóa học/i }).click();

    // Modal đóng lại
    await expect(page.getByRole('heading', { name: /thêm khóa học/i }))
      .not.toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────
  // TC13: Bấm Hủy đóng modal
  // ─────────────────────────────────────────────
  test('TC13 - Bấm Hủy đóng modal form', async ({ page }) => {
    await page.getByRole('button', { name: /thêm khóa học/i }).click();
    await expect(page.getByRole('heading', { name: /thêm khóa học/i })).toBeVisible();

    await page.getByRole('button', { name: /^hủy$/i }).click();

    await expect(page.getByRole('heading', { name: /thêm khóa học/i }))
      .not.toBeVisible({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────
  // TC14: Bấm Sửa mở form với dữ liệu điền sẵn
  // ─────────────────────────────────────────────
  test('TC14 - Bấm Sửa mở form Sửa khóa học với dữ liệu điền sẵn', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    if (count === 0) { test.skip(); return; }

    const courseName = await rows.first().locator('b').innerText();
    await rows.first().getByRole('button', { name: /^sửa$/i }).click();

    await expect(page.getByRole('heading', { name: /sửa khóa học/i })).toBeVisible();
    await expect(page.getByPlaceholder(/tên khóa học/i)).toHaveValue(courseName);
  });

  // ─────────────────────────────────────────────
  // TC15: Click tên khóa học -> chuyển sang trang nội dung
  // ─────────────────────────────────────────────
  test('TC15 - Click tên khóa học chuyển sang trang quản lý nội dung', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    if (count === 0) { test.skip(); return; }

    await rows.first().locator('b').click();

    await expect(page).toHaveURL(/\/manage-course-content\/\d+/, { timeout: 5000 });
  });

});