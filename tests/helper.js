const { expect } = require("@playwright/test");

const loginWith = async (page, username, password) => {
  await page.getByTestId("username").fill(username);
  await page.getByTestId("password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
};

const logout = async (page) => {
  await page.getByRole("button", { name: "Logout" }).click();
  await page.getByText("Please, login").waitFor();
};

const createBlog = async (page, title, author, url) => {
  await page.getByRole("button", { name: "New Blog" }).click();
  await page.getByTestId("title-input").fill(title);
  await page.getByTestId("author-input").fill(author);
  await page.getByTestId("url-input").fill(url);
  await page.getByRole("button", { name: "Create" }).click();

  console.log("Waiting for blog to appear...");
  try {
    await page.locator(".bloglist").getByText(title).waitFor({
      state: "visible",
      timeout: 10000,
    });
    console.log("Blog created successfully");
  } catch (error) {
    console.log("Current page content:", await page.content());
    throw error;
  }
};

const likeBlogNTimes = async (page, title, likesNumber) => {
  const blogListLocator = page.locator(".bloglist");

  const blogLocator = blogListLocator.getByText(title).locator("..");

  await blogLocator.getByRole("button", { name: "View" }).click();

  const likeButtonLocator = blogLocator.getByTestId("like-button");

  for (let i = 0; i < likesNumber; i++) {
    await likeButtonLocator.click();

    const regex = new RegExp(`Likes ${i + 1}\\s*`);

    // This waits for the like component to be rerendered
    await expect(blogLocator.getByText(/Likes \d+/)).toHaveText(regex, {
      timeout: 10000,
    });
  }
};

export { loginWith, createBlog, logout, likeBlogNTimes };
