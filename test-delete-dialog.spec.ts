import { test, expect } from "@playwright/test";

test.use({ storageState: "auth.json" });

test("测试删除小组对话框样式", async ({ page }) => {
  // 访问首页
  await page.goto("http://124.221.163.113:3001/");

  // 等待页面加载
  await page.waitForLoadState("networkidle");

  // 等待"我的AI员工"树形结构加载
  await page.waitForSelector("text=我的AI员工", { timeout: 10000 });

  // 截图：初始状态
  await page.screenshot({ path: "1-initial-state.png" });

  // 查找第一个可展开的部门并展开
  const expandButton = page.locator("button").filter({ hasText: "" }).first();
  await expandButton.click();

  // 等待小组列表加载
  await page.waitForTimeout(1000);

  // 截图：展开部门后的状态
  await page.screenshot({ path: "2-department-expanded.png" });

  // 查找小组右侧的"..."按钮并点击
  const groupMenuButton = page.locator("button").filter({ hasText: "" }).nth(2);
  await groupMenuButton.click();

  // 等待菜单出现
  await page.waitForTimeout(500);

  // 截图：菜单显示
  await page.screenshot({ path: "3-menu-visible.png" });

  // 点击"删除"选项
  const deleteButton = page.getByText("删除");
  await deleteButton.click();

  // 等待确认对话框出现
  await page.waitForTimeout(1000);

  // 截图：确认对话框
  await page.screenshot({ path: "4-confirm-dialog.png", fullPage: true });

  // 检查确认对话框的元素
  const dialogTitle = page
    .locator('[data-state="open"]')
    .locator("h2, dialog[open] div")
    .filter({ hasText: "删除小组" });
  await expect(dialogTitle).toBeVisible();

  console.log("✅ 删除确认对话框已显示");
  console.log(
    "截图已保存到: 1-initial-state.png, 2-department-expanded.png, 3-menu-visible.png, 4-confirm-dialog.png",
  );
});

test("直接访问并测试对话框", async ({ page }) => {
  // 使用无痕模式
  // 注意：playwright默认每个测试都是新的上下文，类似无痕模式

  // 访问登录页面（如果需要）
  await page.goto("http://124.221.163.113:3001/");

  // 等待页面完全加载
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);

  // 截图：首页
  await page.screenshot({ path: "homepage.png", fullPage: true });

  console.log("✅ 已截图首页");
});
