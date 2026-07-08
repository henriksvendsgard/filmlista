import { test, expect } from "@playwright/test";

test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Logg inn med epost")).toBeVisible();
});

test("unauthenticated users are redirected to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
});
