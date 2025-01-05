const { test, expect, beforeEach, describe } = require("@playwright/test");

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
      await page.getByTestId("username").fill("user-1");
      await page.getByTestId("password").fill("password-1");
      await page.getByRole("button", { name: "Login" }).click();

      // Assert
      const message = page.getByText("name-1 logged in");
      await expect(message).toBeVisible();
    });

    test("fails with wrong credentials", async ({ page }) => {
      // Arrange

      // Act
      await page.getByTestId("username").fill("user-1");
      await page.getByTestId("password").fill("wrong");
      await page.getByRole("button", { name: "Login" }).click();

      // Assert
      const message = page.getByText("Invalid credentials");
      await expect(message).toBeVisible();
    });

    describe("When logged in", () => {
      beforeEach(async ({ page }) => {
        // Log in the user
        await page.getByTestId("username").fill("user-1");
        await page.getByTestId("password").fill("password-1");
        await page.getByRole("button", { name: "Login" }).click();
      });

      test("a new blog can be created", async ({ page }) => {
        // Arrange

        // Act
        await page.getByRole("button", { name: "New Blog" }).click();
        await page.getByTestId("title-input").fill("test title");
        await page.getByTestId("author-input").fill("test author");
        await page.getByTestId("url-input").fill("test url");
        await page.getByRole("button", { name: "Create" }).click();

        // Assert
        await expect(
          page.locator(".bloglist").getByText("test title")
        ).toBeVisible();
      });
    });
  });
});
