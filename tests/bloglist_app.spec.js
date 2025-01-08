const { test, expect, beforeEach, describe } = require("@playwright/test");
const { loginWith, logout, createBlog, likeBlogNTimes } = require("./helper");

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

      describe("When there are 3 blogs", () => {
        beforeEach(async ({ page }) => {
          await createBlog(page, "title 1", "author 1", "url 1");
          await createBlog(page, "title 2", "author 2", "url 2");
          await createBlog(page, "title 3", "author 3", "url 3");
        });

        test("blogs are arranged in the order according to the likes, with the most likes first", async ({
          page,
        }) => {
          await likeBlogNTimes(page, "title 1", 1);
          await likeBlogNTimes(page, "title 2", 3);
          await likeBlogNTimes(page, "title 3", 5);

          // Access the DOM in order, and expect to be sorted
          const blogsLocator = page.locator(".bloglist").locator(".blog");

          const firstBlogLikes = await blogsLocator
            .first()
            .getByText(/Likes \d+/)
            .textContent();
          const firstPlace = parseInt(firstBlogLikes.split(" ")[1]);

          const secondBloglikes = await blogsLocator
            .nth(1)
            .getByText(/Likes \d+/)
            .textContent();
          const secondPlace = parseInt(secondBloglikes.split(" ")[1]);

          const thirdBlogLikes = await blogsLocator
            .nth(2)
            .getByText(/Likes \d+/)
            .textContent();
          const thirdPlace = parseInt(thirdBlogLikes.split(" ")[1]);

          expect(firstPlace).toBe(5);
          expect(secondPlace).toBe(3);
          expect(thirdPlace).toBe(1);
        });
      });
    });
  });
});
