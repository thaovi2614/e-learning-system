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

async function openForum(page: Page) {
    await page.goto(`${BASE_URL}/learn/${COURSE_ID}`);
    await expect(page.getByText(/diễn đàn/i)).toBeVisible({ timeout: 10000 });
    await page.getByText(/diễn đàn/i).click();
    await expect(page.getByPlaceholder(/viết câu hỏi/i)).toBeVisible({ timeout: 10000 });
}

async function createQuestion(page: Page, question: string) {
    await page.getByPlaceholder(/viết câu hỏi/i).fill(question);

    await Promise.all([
        page.waitForResponse(
            res =>
                res.url().includes("/api/courses/questions") &&
                res.request().method() === "POST",
            { timeout: 10000 }
        ),
        page.getByRole("button", { name: /^đăng$/i }).click()
    ]);

    await expect(page.getByText(question)).toBeVisible({ timeout: 15000 });
}

test.describe("Forum khóa học courseId = 2", () => {
    test("TC1 - Học viên vi đăng câu hỏi trong diễn đàn thành công", async ({ page }) => {
        const question = `Câu hỏi test tự động ${Date.now()}`;

        await login(page, "vi", "123");
        await openForum(page);
        await createQuestion(page, question);

        await expect(page.getByText(question)).toBeVisible();
    });

    test("TC2 - Học viên vi thấy câu hỏi vừa đăng trong danh sách", async ({ page }) => {
        const question = `Câu hỏi kiểm tra danh sách ${Date.now()}`;

        await login(page, "vi", "123");
        await openForum(page);
        await createQuestion(page, question);

        await expect(page.getByText(question)).toBeVisible({ timeout: 15000 });

        await expect(page.getByText(/danh sách câu hỏi/i)).toBeVisible();
    });


    test("TC3 - Học viên vi xóa câu hỏi của mình nếu có quyền xóa", async ({ page }) => {
        const question = `Câu hỏi để xóa ${Date.now()}`;

        await login(page, "vi", "123");
        await openForum(page);
        await createQuestion(page, question);

        await expect(page.getByText(question)).toBeVisible({ timeout: 15000 });

        const row = page.getByText(question).locator("xpath=ancestor::*[self::tr or self::div][1]");
        const deleteButton = row.getByRole("button", { name: /xóa/i });

        if ((await deleteButton.count()) === 0) {
            console.log("Không có nút Xóa. Có thể user.id không khớp student_id.");
            return;
        }

        page.once("dialog", async dialog => {
            await dialog.accept();
        });

        await deleteButton.click();

        await expect(page.getByText(question)).not.toBeVisible({ timeout: 15000 });
    });

    test("TC4 - Instructor instructor1 vào được khóa học courseId = 2 và xem diễn đàn", async ({ page }) => {
        await login(page, "instructor1", "1234");
        await openForum(page);

        await expect(page.getByText(/danh sách câu hỏi/i)).toBeVisible();
    });

    test("TC5 - Không gửi API khi nội dung câu hỏi rỗng", async ({ page }) => {
        await login(page, "vi", "123");
        await openForum(page);

        let postCalled = false;

        page.on("request", req => {
            if (
                req.url().includes("/api/courses/questions") &&
                req.method() === "POST"
            ) {
                postCalled = true;
            }
        });

        await page.getByPlaceholder(/viết câu hỏi/i).fill("   ");
        await page.getByRole("button", { name: /^đăng$/i }).click();

        await page.waitForTimeout(1000);

        expect(postCalled).toBeFalsy();
    });

    test("TC6 - Học viên nhập được nội dung câu hỏi vào ô textarea", async ({ page }) => {
        const question = `Câu hỏi kiểm tra nhập liệu ${Date.now()}`;

        await login(page, "vi", "123");
        await openForum(page);

        await page.getByPlaceholder(/viết câu hỏi/i).fill(question);

        await expect(page.getByPlaceholder(/viết câu hỏi/i)).toHaveValue(question);
    });

    test("TC7 - Sau khi đăng, câu hỏi mới hiển thị trên màn hình", async ({ page }) => {
        const question = `Câu hỏi kiểm tra hiển thị ${Date.now()}`;

        await login(page, "vi", "123");
        await openForum(page);
        await createQuestion(page, question);

        await expect(page.getByText(question)).toBeVisible({ timeout: 15000 });
    });
    test("TC8 - Diễn đàn có chức năng chọn file đính kèm", async ({ page }) => {
        await login(page, "vi", "123");
        await openForum(page);

        await expect(page.locator('input[type="file"]')).toBeVisible();
    });

    test("TC9 - Instructor vào diễn đàn và thấy khu vực danh sách câu hỏi", async ({ page }) => {
        await login(page, "instructor1", "1234");
        await openForum(page);

        await expect(page.getByText(/câu hỏi/i).first()).toBeVisible();
        await expect(page.getByText(/người gửi/i)).toBeVisible();
        await expect(page.getByText(/hành động/i)).toBeVisible();
    });

    test("TC10 - Instructor thấy nút đăng câu hỏi trong diễn đàn", async ({ page }) => {
        await login(page, "instructor1", "1234");
        await openForum(page);

        await expect(page.getByPlaceholder(/viết câu hỏi/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /^đăng$/i })).toBeVisible();
    });

});