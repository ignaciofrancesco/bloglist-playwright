const { test, expect, beforeEach, describe } = require("@playwright/test");
const { loginWith, createBlog } = require("./helper");
const { log } = require("console");

describe("Blog app", () => {
  beforeEach(async ({ page, request }) => {
    // Reset the DB
    await request.post("http://localhost:3003/api/testing/reset");

    // create a user for the backend here
    await request.post("http://localhost:3003/api/users", {
      data: {
        username: "user-1",
        password: "password-1",
        name: "name-1",
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

    describe("When logged in", () => {
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

      describe("When there are 2 blogs", () => {
        beforeEach(async ({ page }) => {
          await createBlog(page, "test title 2", "test author 2", "test url 2");
        });

        test("a blog can be liked", async ({ page }) => {
          const blogLocator = page
            .locator(".bloglist")
            .getByText("test title 2")
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
      });
    });
  });
});
