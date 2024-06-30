const loginWith = async (page, username, password) => {
  await page.getByLabel("username").fill(username);
  await page.getByLabel("password").fill(password);
  await page.getByRole("button", { name: "login" }).click();
};

const createBlog = async (page, blogObject) => {
  await page.getByRole("button", { name: "create new" }).click();
  await page.getByLabel("title").fill(blogObject.title);
  await page.getByLabel("author").fill(blogObject.author);
  await page.getByLabel("url").fill(blogObject.url);
  await page.getByRole("button", { name: "create" }).click();
};

module.exports = { loginWith, createBlog };
