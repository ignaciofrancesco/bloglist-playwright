const { test, expect, beforeEach, describe } = require("@playwright/test");
const { loginWith, logout, createBlog } = require("./helper");

describe("Blog app", () => {
  beforeEach(async ({ page, request }) => {
    // Reset the DB
    await request.post("http://localhost:3003/api/testing/reset");

    // create user 1 for the backend here
    await request.post("http://localhost:3003/api/users", {
      data: {
        username: "user-1",
        password: "password-1",
        name: "name-1",
      },
    });

    // create user 1 for the backend here
    await request.post("http://localhost:3003/api/users", {
      data: {
        username: "user-2",
        password: "password-2",
        name: "name-2",
      },
    });

    // Navigate to homepage
    await page.goto("http://localhost:5173");
  });

  test("Login form is shown", async ({ page }) => {
    const loginForm = page.getByTestId("login-form");
    await expect(loginForm).toBeVisible();
  });

  describe("Login", () => {
    test("succeeds with correct credentials", async ({ page }) => {
      // Arrange

      // Act
      await loginWith(page, "user-1", "password-1");

      // Assert
      const message = page.getByText("name-1 logged in");
      await expect(message).toBeVisible();
    });

    test("fails with wrong credentials", async ({ page }) => {
      // Arrange

      // Act
      await loginWith(page, "user-1", "wrong");

      // Assert
      const message = page.getByText("Invalid credentials");
      await expect(message).toBeVisible();
    });

    describe("When logged in as user-1", () => {
      beforeEach(async ({ page }) => {
        // Log in the user
        await loginWith(page, "user-1", "password-1");
      });

      test("a new blog can be created", async ({ page }) => {
        // Arrange
        // Act
        await createBlog(page, "test title", "test author", "test url");

        // Assert
        await expect(
          page.locator(".bloglist").getByText("test title")
        ).toBeVisible();
      });

      describe("When there is a blog", () => {
        beforeEach(async ({ page }) => {
          await createBlog(page, "test title 1", "test author 1", "test url 1");
        });

        test("the blog can be liked", async ({ page }) => {
          const blogLocator = page
            .locator(".bloglist")
            .getByText("test title 1")
            .locator("..");

          // Expand the blog details by clicking 'View'
          await blogLocator.getByRole("button", { name: "View" }).click();

          // Click the like button
          await blogLocator.getByTestId("like-button").click();

          // Wait for the likes count to update
          const likesLocator = blogLocator.getByText(/Likes \d+/);
          await expect(likesLocator).toBeVisible(); // Ensure the likes element is rendered

          // Wait for the likes count to reach 1
          await expect(likesLocator).toHaveText(/Likes 1/);
        });

        test("the user that created the blog can delete it", async ({
          page,
        }) => {
          const blogLocator = page
            .locator(".bloglist")
            .getByText("test title 1")
            .locator("..");

          // Listener to confirm removal
          page.on("dialog", (dialog) => dialog.accept());

          // Remove the blog
          await blogLocator.getByRole("button", { name: "Remove" }).click();

          // Expect the blogLocator to not be visible anymore
          await expect(blogLocator).not.toBeVisible();
        });

        test("another user cannot see the remove button", async ({ page }) => {
          // Logout
          await logout(page);

          // Login as user-2
          await loginWith(page, "user-2", "password-2");

          const blogLocator = page
            .locator(".bloglist")
            .getByText("test title 1")
            .locator("..");

          await expect(blogLocator).toBeVisible();

          await expect(
            blogLocator.getByRole("button", { name: "Remove" })
          ).not.toBeVisible();
        });
      });
    });
  });
});
