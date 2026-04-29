import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5173';

// Đăng nhập INSTRUCTOR trước mỗi test
async function loginInstructor(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.locator('input[name="username"]').fill('instructor3');
  await page.locator('input[name="password"]').fill('1234');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
}

test.describe('Quản Lý Khóa Học (INSTRUCTOR)', () => {

  test.beforeEach(async ({ page }) => {
    await loginInstructor(page);
    await page.goto(`${BASE}/manage-course`);
    await page.waitForTimeout(1500);
  });

  // ─────────────────────────────────────────────
  // TC1: Giao diện hiển thị đúng
  // ─────────────────────────────────────────────
  test('TC1 - Hiển thị đầy đủ giao diện trang quản lý', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /quản lý khóa học/i })).toBeVisible();
    await expect(page.getByPlaceholder(/tìm kiếm khóa học/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /thêm khóa học/i })).toBeVisible();
    await expect(page.getByText(/tổng khóa học/i)).toBeVisible();
    await expect(page.getByText(/đang hoạt động/i)).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC2: Hiển thị bảng danh sách khóa học
  // ─────────────────────────────────────────────
  test('TC2 - Bảng danh sách khóa học hiển thị đúng cột', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /tên khóa học/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /danh mục/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /giá/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /trạng thái/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /thao tác/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC3: Tìm kiếm khóa học theo tên
  // ─────────────────────────────────────────────
  test('TC3 - Tìm kiếm khóa học theo tên', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const totalBefore = await rows.count();

    if (totalBefore === 0) {
      test.skip();
      return;
    }

    // Lấy tên khóa học đầu tiên để search
    const firstName = await page.locator('tbody tr').first()
      .locator('b').innerText();

    await page.getByPlaceholder(/tìm kiếm khóa học/i).fill(firstName);
    await page.waitForTimeout(500);

    // Phải còn ít nhất 1 kết quả
    await expect(page.locator('tbody tr')).not.toHaveCount(0);
  });

  // ─────────────────────────────────────────────
  // TC4: Tìm kiếm không có kết quả
  // ─────────────────────────────────────────────
  test('TC4 - Tìm kiếm không có kết quả hiện thông báo', async ({ page }) => {
    await page.getByPlaceholder(/tìm kiếm khóa học/i).fill('xyzkhongtontai999');
    await page.waitForTimeout(500);

    await expect(page.getByText(/chưa có khóa học nào/i)).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC5: Mở form thêm khóa học
  // ─────────────────────────────────────────────
  test('TC5 - Bấm Thêm khóa học mở form modal', async ({ page }) => {
    await page.getByRole('button', { name: /thêm khóa học/i }).click();

    await expect(page.getByRole('heading', { name: /thêm khóa học/i })).toBeVisible();
    await expect(page.getByPlaceholder(/tên khóa học/i)).toBeVisible();
    await expect(page.getByPlaceholder(/mô tả ngắn/i)).toBeVisible();
    await expect(page.getByPlaceholder(/giá/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /tạo khóa học/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /hủy/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC6: Tạo khóa học thành công
  // ─────────────────────────────────────────────
  test('TC6 - Tạo khóa học mới thành công', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/tạo khóa học thành công/i);
      await dialog.accept();
    });

    await page.getByRole('button', { name: /thêm khóa học/i }).click();

    await page.getByPlaceholder(/tên khóa học/i).fill(`Test Course ${Date.now()}`);
    await page.getByPlaceholder(/mô tả ngắn/i).fill('Subtitle test');
    await page.getByPlaceholder(/giá/i).fill('100000');

    // Chọn danh mục
    await page.locator('select[name="category_id"]').selectOption({ index: 1 });

    await page.getByRole('button', { name: /tạo khóa học/i }).click();

    // Modal phải đóng lại sau khi tạo thành công
    await expect(page.getByRole('heading', { name: /thêm khóa học/i }))
      .not.toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────
  // TC7: Tạo khóa học thiếu tên -> alert lỗi
  // ─────────────────────────────────────────────
  test('TC7 - Tạo khóa học thiếu tên hiện thông báo lỗi', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/tên khóa học không được để trống/i);
      await dialog.accept();
    });

    await page.getByRole('button', { name: /thêm khóa học/i }).click();
    await page.getByRole('button', { name: /tạo khóa học/i }).click();
  });

  // ─────────────────────────────────────────────
  // TC8: Tạo khóa học thiếu giá -> alert lỗi
  // ─────────────────────────────────────────────
  test('TC8 - Tạo khóa học thiếu giá hiện thông báo lỗi', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/giá không được để trống|subtitle không được để trống/i);
      await dialog.accept();
    });

    await page.getByRole('button', { name: /thêm khóa học/i }).click();
    await page.getByPlaceholder(/tên khóa học/i).fill('Test Course');
    await page.getByPlaceholder(/mô tả ngắn/i).fill('Subtitle test');
    // Bỏ trống giá
    await page.getByRole('button', { name: /tạo khóa học/i }).click();
  });

  // ─────────────────────────────────────────────
  // TC9: Bấm Hủy đóng form
  // ─────────────────────────────────────────────
  test('TC9 - Bấm Hủy đóng modal form', async ({ page }) => {
    await page.getByRole('button', { name: /thêm khóa học/i }).click();
    await expect(page.getByRole('heading', { name: /thêm khóa học/i })).toBeVisible();

    await page.getByRole('button', { name: /hủy/i }).click();

    await expect(page.getByRole('heading', { name: /thêm khóa học/i }))
      .not.toBeVisible({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────
  // TC10: Mở form Sửa khóa học -> điền sẵn dữ liệu
  // ─────────────────────────────────────────────
  test('TC10 - Bấm Sửa mở form với dữ liệu điền sẵn', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const count = await rows.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Lấy tên khóa học hiện tại
    const courseName = await rows.first().locator('b').innerText();

    await rows.first().getByRole('button', { name: /sửa/i }).click();

    // Form mở với tiêu đề "Sửa khóa học"
    await expect(page.getByRole('heading', { name: /sửa khóa học/i })).toBeVisible();

    // Input tên phải điền sẵn
    const nameInput = page.getByPlaceholder(/tên khóa học/i);
    await expect(nameInput).toHaveValue(courseName);
  });

  // ─────────────────────────────────────────────
  // TC11: Xóa khóa học -> xác nhận dialog
  // ─────────────────────────────────────────────
  test('TC11 - Bấm Xóa hiện dialog xác nhận', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const count = await rows.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Bắt dialog confirm
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/xác nhận xóa/i);
      await dialog.dismiss(); // Bấm Cancel để không xóa thật
    });

    await rows.first().getByRole('button', { name: /xóa/i }).click();
  });

  // ─────────────────────────────────────────────
  // TC12: Bấm Làm mới reload danh sách
  // ─────────────────────────────────────────────
  test('TC12 - Bấm Làm mới reload danh sách khóa học', async ({ page }) => {
    await page.getByRole('button', { name: /làm mới/i }).click();
    await page.waitForTimeout(1500);

    // Bảng vẫn hiển thị bình thường sau reload
    await expect(page.locator('table')).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TC13: Click vào tên khóa học -> chuyển sang trang nội dung
  // ─────────────────────────────────────────────
  test('TC13 - Click tên khóa học chuyển sang trang quản lý nội dung', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const count = await rows.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await rows.first().locator('b').click();

    await expect(page).toHaveURL(/\/manage-course-content\/\d+/, { timeout: 5000 });
  });

});