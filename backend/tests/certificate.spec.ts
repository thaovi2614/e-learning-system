import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

// =====================================================================
// HELPER: Đăng nhập trước mỗi test
// =====================================================================
async function login(page: any) {
    await page.goto(`${BASE}/login`);
    await page.getByPlaceholder('Tên đăng nhập').fill('u1');
    await page.getByPlaceholder('Mật khẩu').fill('1234');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).not.toHaveURL(/\/login/);
}

// =====================================================================
// NHÓM 1: TRẠNG THÁI LOADING
// =====================================================================
test.describe('NHÓM 1 - TRẠNG THÁI LOADING', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('TC1_1 - Hiển thị text loading khi đang tải chứng nhận', async ({ page }) => {
        // Delay API để bắt trạng thái loading
        await page.route('**/api/certificates/**', async (route) => {
            await new Promise((res) => setTimeout(res, 1500));
            await route.continue();
        });

        await page.goto(`${BASE}/certificate/1`);
        await expect(page.getByText(/đang tải chứng nhận/i)).toBeVisible();
    });

    test('TC1_2 - Text loading biến mất sau khi tải xong', async ({ page }) => {
        await page.goto(`${BASE}/certificate/1`);
        await expect(page.getByText(/đang tải chứng nhận/i)).not.toBeVisible({ timeout: 5000 });
    });

    test('TC1_3 - Không crash khi API trả về lỗi trong lúc loading', async ({ page }) => {
        await page.route('**/api/certificates/**', (route) => route.abort());

        await page.goto(`${BASE}/certificate/999`);

        // Sau khi lỗi, trang phải hiện trạng thái "chưa có chứng nhận" chứ không crash
        await expect(page.getByText(/đang tải chứng nhận/i)).not.toBeVisible({ timeout: 5000 });
        await expect(page.locator('body')).toBeVisible();
    });

    test('TC1_4 - Không hiển thị nội dung certificate khi đang loading', async ({ page }) => {
        await page.route('**/api/certificates/**', async (route) => {
            await new Promise((res) => setTimeout(res, 2000));
            await route.continue();
        });

        await page.goto(`${BASE}/certificate/1`);

        // Trong lúc loading, chưa được render certificate-card
        const certCard = page.locator('.certificate-card');
        await expect(certCard).not.toBeVisible();
    });
});

// =====================================================================
// NHÓM 2: TRẠNG THÁI CHƯA CÓ CHỨNG NHẬN (cert-empty)
// =====================================================================
test.describe('NHÓM 2 - TRẠNG THÁI CHƯA CÓ CHỨNG NHẬN', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);

        // Mock API trả về null / lỗi để kích hoạt trạng thái cert-empty
        await page.route('**/api/certificates/**', (route) =>
            route.fulfill({ status: 404, body: '' })
        );
    });

    test('TC2_1 - Hiển thị tiêu đề "Chưa có chứng nhận"', async ({ page }) => {
        await page.goto(`${BASE}/certificate/1`);
        await expect(page.getByRole('heading', { name: /chưa có chứng nhận/i })).toBeVisible();
    });

    test('TC2_2 - Hiển thị hướng dẫn hoàn thành 100% khóa học', async ({ page }) => {
        await page.goto(`${BASE}/certificate/1`);
        await expect(page.getByText(/hoàn thành 100% khóa học/i)).toBeVisible();
    });

    test('TC2_3 - Nút "Quay lại khóa học" hiển thị và có thể click', async ({ page }) => {
        await page.goto(`${BASE}/certificate/1`);

        const backBtn = page.getByRole('button', { name: /quay lại khóa học/i });
        await expect(backBtn).toBeVisible();
        await backBtn.click();

        await expect(page).toHaveURL(/\/learn\/1/);
    });

    test('TC2_4 - Không hiển thị certificate-card khi chưa có chứng nhận', async ({ page }) => {
        await page.goto(`${BASE}/certificate/1`);
        await expect(page.locator('.certificate-card')).not.toBeVisible();
    });
});






// =====================================================================
// NHÓM 4: CHỨC NĂNG ĐIỀU HƯỚNG (NAVIGATE)
// =====================================================================
test.describe('NHÓM 3 - CHỨC NĂNG ĐIỀU HƯỚNG', () => {
    const mockCertificate = {
        user_name: 'Trần Thị B',
        course_name: 'JavaScript nâng cao',
        certificate_code: 'CERT-2024-002',
        issued_at: '2024-07-01T00:00:00.000Z',
    };

    test.beforeEach(async ({ page }) => {
        await login(page);

        await page.route('**/api/certificates/**', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: mockCertificate }),
            })
        );
    });

    test('TC4_1 - Nút "Quay lại khóa học" trên cert-actions hiển thị khi có chứng nhận', async ({ page }) => {
        await page.goto(`${BASE}/certificate/2`);

        const backBtn = page.locator('.cert-actions button').first();
        await expect(backBtn).toBeVisible();
        await expect(backBtn).toContainText(/quay lại khóa học/i);
    });

    test('TC4_2 - Nút "Quay lại khóa học" chuyển đúng sang /learn/:courseId', async ({ page }) => {
        await page.goto(`${BASE}/certificate/2`);

        await page.locator('.cert-actions button').first().click();
        await expect(page).toHaveURL(/\/learn\/2/);
    });

    test('TC4_3 - URL chứa đúng courseId khi truy cập trang chứng nhận', async ({ page }) => {
        await page.goto(`${BASE}/certificate/99`);
        await expect(page).toHaveURL(`${BASE}/certificate/99`);
    });

    test('TC4_4 - Truy cập đúng trang certificate theo courseId khác nhau không bị nhầm lẫn', async ({ page }) => {
        // Vào courseId = 10
        await page.goto(`${BASE}/certificate/10`);
        await expect(page).toHaveURL(/\/certificate\/10/);

        // Chuyển sang courseId = 20
        await page.goto(`${BASE}/certificate/20`);
        await expect(page).toHaveURL(/\/certificate\/20/);
    });
});

// =====================================================================
// NHÓM 5: CHỨC NĂNG TẢI PDF
// =====================================================================
test.describe('NHÓM 5 - CHỨC NĂNG TẢI PDF', () => {
    const mockCertificate = {
        user_name: 'Lê Văn C',
        course_name: 'Node.js & Express',
        certificate_code: 'CERT-2024-003',
        issued_at: '2024-08-20T00:00:00.000Z',
    };

    test.beforeEach(async ({ page }) => {
        await login(page);

        await page.route('**/api/certificates/**', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: mockCertificate }),
            })
        );
    });

    test('TC5_1 - Nút "Tải chứng nhận PDF" hiển thị khi có chứng nhận', async ({ page }) => {
        await page.goto(`${BASE}/certificate/3`);

        const downloadBtn = page.locator('.download-btn');
        await expect(downloadBtn).toBeVisible();
        await expect(downloadBtn).toContainText(/tải chứng nhận pdf/i);
    });

    test('TC5_2 - Nút "Tải chứng nhận PDF" có thể click (không bị disabled)', async ({ page }) => {
        await page.goto(`${BASE}/certificate/3`);

        const downloadBtn = page.locator('.download-btn');
        await expect(downloadBtn).toBeEnabled();
    });

    test('TC5_3 - Click tải PDF không làm trang bị crash hoặc navigate đi', async ({ page }) => {
        await page.goto(`${BASE}/certificate/3`);

        // Chờ certificate load xong trước
        await expect(page.locator('.certificate-card')).toBeVisible();

        await page.locator('.download-btn').click();

        // Trang vẫn ở URL certificate sau khi click
        await expect(page).toHaveURL(/\/certificate\/3/);
        await expect(page.locator('.certificate-card')).toBeVisible();
    });

    test('TC5_4 - Nút tải PDF không xuất hiện khi chưa có chứng nhận', async ({ page }) => {
        // Override mock để trả về 404
        await page.route('**/api/certificates/**', (route) =>
            route.fulfill({ status: 404, body: '' })
        );

        await page.goto(`${BASE}/certificate/3`);

        await expect(page.locator('.download-btn')).not.toBeVisible();
    });
});