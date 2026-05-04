import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:5173";
const COURSE_ID = 2;

async function login(page: Page, username: string, password: string) {
    await page.goto(`${BASE_URL}/login`);

    await page.getByPlaceholder(/tên đăng nhập|username|email/i).fill(username);
    await page.getByPlaceholder(/mật khẩu|password/i).fill(password);

    await page.getByRole("button", { name: /đăng nhập|login/i }).click();

    await expect(page).not.toHaveURL(/login/i, { timeout: 10000 });
}

test.describe("LearnCourse page - courseId = 2", () => {
    test("TC1 - Học viên vào trang học khóa học thành công", async ({ page }) => {
        await login(page, "vi", "123");

        await page.goto(`${BASE_URL}/learn/${COURSE_ID}`);

        await expect(page.getByRole("button", { name: /khóa học/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /bài học/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /diễn đàn/i })).toBeVisible();
    });

    test("TC2 - Mặc định hiển thị tab Bài học", async ({ page }) => {
        await login(page, "vi", "123");

        await page.goto(`${BASE_URL}/learn/${COURSE_ID}`);

        await expect(page.getByRole("button", { name: /bài học/i })).toHaveClass(/active/);
    });

    test("TC3 - Click tab Diễn đàn thì hiển thị ForumTab", async ({ page }) => {
        await login(page, "vi", "123");

        await page.goto(`${BASE_URL}/learn/${COURSE_ID}`);

        await page.getByRole("button", { name: /diễn đàn/i }).click();

        await expect(page.getByRole("button", { name: /diễn đàn/i })).toHaveClass(/active/);
        await expect(page.getByPlaceholder(/viết câu hỏi/i)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/danh sách câu hỏi/i)).toBeVisible();
    });

    test("TC4 - Click tab Bài học sau khi ở Diễn đàn thì quay lại tab Bài học", async ({ page }) => {
        await login(page, "vi", "123");

        await page.goto(`${BASE_URL}/learn/${COURSE_ID}`);

        await page.getByRole("button", { name: /diễn đàn/i }).click();
        await expect(page.getByPlaceholder(/viết câu hỏi/i)).toBeVisible({ timeout: 10000 });

        await page.getByRole("button", { name: /bài học/i }).click();

        await expect(page.getByRole("button", { name: /bài học/i })).toHaveClass(/active/);
    });

    test("TC5 - Nút quay lại Khóa học chuyển về trang my-courses", async ({ page }) => {
        await login(page, "vi", "123");

        await page.goto(`${BASE_URL}/learn/${COURSE_ID}`);

        await page.getByRole("button", { name: /khóa học/i }).click();

        await expect(page).toHaveURL(/\/my-courses/, { timeout: 10000 });
    });

    test("TC6 - Click tab Diễn đàn thì vẫn ở trang learn và hiển thị ForumTab", async ({ page }) => {
        await login(page, "vi", "123");

        await page.goto(`${BASE_URL}/learn/${COURSE_ID}`);

        await page.getByRole("button", { name: /diễn đàn/i }).click();

        await expect(page).toHaveURL(new RegExp(`/learn/${COURSE_ID}`));
        await expect(page.getByRole("button", { name: /diễn đàn/i })).toHaveClass(/active/);
        await expect(page.getByPlaceholder(/viết câu hỏi/i)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/danh sách câu hỏi/i)).toBeVisible();
    });
    test("TC7 - Trang học có đủ layout chính", async ({ page }) => {
        await login(page, "vi", "123");

        await page.goto(`${BASE_URL}/learn/${COURSE_ID}`);

        await expect(page.locator(".learn-container")).toBeVisible();
        await expect(page.locator(".tabs")).toBeVisible();
        await expect(page.locator(".tab-content")).toBeVisible();
    });

    test("TC8 - Khi ở tab Bài học thì không hiển thị ô viết câu hỏi", async ({ page }) => {
        await login(page, "vi", "123");

        await page.goto(`${BASE_URL}/learn/${COURSE_ID}`);

        await expect(page.getByRole("button", { name: /bài học/i })).toHaveClass(/active/);
        await expect(page.getByPlaceholder(/viết câu hỏi/i)).not.toBeVisible();
    });

    test("TC9 - Khi chuyển sang Diễn đàn thì tab Bài học không còn active", async ({ page }) => {
        await login(page, "vi", "123");

        await page.goto(`${BASE_URL}/learn/${COURSE_ID}`);

        await page.getByRole("button", { name: /diễn đàn/i }).click();

        await expect(page.getByRole("button", { name: /diễn đàn/i })).toHaveClass(/active/);
        await expect(page.getByRole("button", { name: /bài học/i })).not.toHaveClass(/active/);
    });

    test("TC10 - Khi chuyển từ Diễn đàn về Bài học thì ForumTab biến mất", async ({ page }) => {
        await login(page, "vi", "123");

        await page.goto(`${BASE_URL}/learn/${COURSE_ID}`);

        await page.getByRole("button", { name: /diễn đàn/i }).click();
        await expect(page.getByPlaceholder(/viết câu hỏi/i)).toBeVisible({ timeout: 10000 });

        await page.getByRole("button", { name: /bài học/i }).click();

        await expect(page.getByRole("button", { name: /bài học/i })).toHaveClass(/active/);
        await expect(page.getByPlaceholder(/viết câu hỏi/i)).not.toBeVisible();
    });

    test("TC11 - Nút Khóa học có nội dung quay lại rõ ràng", async ({ page }) => {
        await login(page, "vi", "123");

        await page.goto(`${BASE_URL}/learn/${COURSE_ID}`);

        await expect(page.getByRole("button", { name: /khóa học/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /khóa học/i })).toContainText("Khóa học");
    });
});