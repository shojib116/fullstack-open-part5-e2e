const { test, expect, beforeEach, describe } = require("@playwright/test");
const { loginWith, createBlog, initialBlogs } = require("./test_helper");

const test_user = {
  name: "Test User",
  username: "testuser",
  password: "test",
};

const another_test_user = {
  name: "Test User 2",
  username: "testuser2",
  password: "test2",
};

const test_blog = {
  title: "React patterns",
  author: "Michael Chan",
  url: "https://reactpatterns.com/",
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

  describe("When logged in", () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, test_user.username, test_user.password);
    });

    test("a new blog can be created", async ({ page }) => {
      await createBlog(page, test_blog);

      await expect(
        page.getByText(`${test_blog.title} - ${test_blog.author}`)
      ).toBeVisible();
    });

    describe("When a blog exists", () => {
      beforeEach(async ({ page }) => {
        await createBlog(page, test_blog);
      });

      test("the blog can be liked", async ({ page }) => {
        await page.getByRole("button", { name: "view" }).click();

        await expect(page.getByText("likes 0")).toBeVisible();

        await page.getByRole("button", { name: "like" }).click();

        await page.getByText("likes 1").waitFor();
        await expect(page.getByText("likes 1")).toBeVisible();
      });

      test("the blog can be deleted", async ({ page }) => {
        page.on("dialog", async (dialog) => {
          expect(dialog.type()).toContain("confirm");
          await dialog.accept();
        });
        await page.getByRole("button", { name: "view" }).click();
        await page.getByRole("button", { name: "remove" }).click();

        await expect(
          page.getByText(`${test_blog.title} - ${test_blog.author}`)
        ).not.toBeVisible();
      });

      test("only the user who created the blog can see the remove blog button", async ({
        page,
        request,
      }) => {
        await page.getByRole("button", { name: "view" }).click();
        await expect(
          page.getByRole("button", { name: "remove" })
        ).toBeVisible();

        await request.post("/api/users", {
          data: another_test_user,
        });
        await page.getByRole("button", { name: "logout" }).click();
        await expect(page.getByRole("button", { name: "login" })).toBeVisible();

        await loginWith(
          page,
          another_test_user.username,
          another_test_user.password
        );

        await expect(
          page.getByText(`${another_test_user.name} logged in`)
        ).toBeVisible();

        await page.getByRole("button", { name: "view" }).click();
        await expect(
          page.getByRole("button", { name: "remove" })
        ).not.toBeVisible();
      });
    });

    describe("When many blog exists", () => {
      beforeEach(async ({ page, request }) => {
        for (let i = 0; i < initialBlogs.length; i++) {
          await request.post("/api/tests/create_blog", {
            data: initialBlogs[i],
          });
        }
      });

      test("they are ordered by like count", async ({ page }) => {
        await page.reload();
        await page.getByRole("button", { name: "view" }).first().waitFor();
        const viewButtons = await page
          .getByRole("button", { name: "view" })
          .all();

        let likes = [];

        for (let i = 0; i < viewButtons.length; i++) {
          await viewButtons[i].click();
          const text = await page.getByText(/likes \d+/).textContent();
          likes = likes.concat(Number(text.split(" ")[1]));
          await page.getByRole("button", { name: "hide" }).click();
        }

        for (let i = 0; i < likes.length - 1; i++) {
          expect(likes[i]).toBeGreaterThanOrEqual(likes[i + 1]);
        }
      });
    });
  });
});
