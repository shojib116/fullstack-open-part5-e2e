const { test, expect, beforeEach, describe } = require("@playwright/test");
const { loginWith } = require("./test_helper");

const test_user = {
  name: "Test User",
  username: "testuser",
  password: "test",
};

describe("Blog app", () => {
  beforeEach(async ({ page, request }) => {
    await request.post("/api/tests/reset");
    await request.post("/api/users", {
      data: test_user,
    });

    await page.goto("http://localhost:5173");
  });

  test("Login form is shown", async ({ page }) => {
    await expect(page.getByLabel("username")).toBeVisible();
    await expect(page.getByLabel("password")).toBeVisible();
    await expect(page.getByRole("button", { name: "login" })).toBeVisible();
  });

  describe("Login", () => {
    test("succeeds with correct credentials", async ({ page }) => {
      await loginWith(page, test_user.username, test_user.password);

      await expect(page.locator(".success")).toHaveText(
        `logged in as ${test_user.name}`
      );
      await expect(page.locator(".success")).toHaveCSS("border-style", "solid");
      await expect(page.locator(".success")).toHaveCSS(
        "color",
        "rgb(0, 128, 0)"
      );
      await expect(page.getByText(`${test_user.name} logged in`)).toBeVisible();
    });

    test("fails with wrong credentials", async ({ page }) => {
      await loginWith(page, test_user.username, "pass");

      await expect(page.locator(".error")).toHaveText(
        "invalid username or password"
      );
      await expect(page.locator(".error")).toHaveCSS("border-style", "solid");
      await expect(page.locator(".error")).toHaveCSS("color", "rgb(255, 0, 0)");
    });
  });
});
