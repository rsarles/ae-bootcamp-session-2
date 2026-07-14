const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

test.describe('Todo workflow', () => {
  let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('create a task without a due date', async () => {
    await todoPage.addTask('Buy groceries');

    const visible = await todoPage.isTaskVisible('Buy groceries');
    expect(visible).toBe(true);
  });

  test('create a task with a due date', async () => {
    await todoPage.addTask('Submit report', '2099-12-31');

    const visible = await todoPage.isTaskVisible('Submit report');
    expect(visible).toBe(true);

    const dueText = await todoPage.page.locator('li .due-date').filter({ hasText: '2099-12-31' }).textContent();
    expect(dueText).toContain('2099-12-31');
  });

  test('edit a task name', async () => {
    await todoPage.addTask('Original task name');

    await todoPage.clickEditForTask('Original task name');
    await todoPage.saveEdit('Updated task name');

    const updated = await todoPage.isTaskVisible('Updated task name');
    expect(updated).toBe(true);

    const original = await todoPage.isTaskVisible('Original task name');
    expect(original).toBe(false);
  });

  test('mark a task as completed', async () => {
    await todoPage.addTask('Task to complete');

    await todoPage.toggleComplete('Task to complete');

    const completed = await todoPage.isTaskCompleted('Task to complete');
    expect(completed).toBe(true);
  });

  test('delete a task', async () => {
    await todoPage.addTask('Task to delete');

    await todoPage.deleteTask('Task to delete');

    const visible = await todoPage.isTaskVisible('Task to delete');
    expect(visible).toBe(false);
  });

  test('filter tasks by completed status', async () => {
    await todoPage.addTask('Active task');
    await todoPage.addTask('Completed task');
    await todoPage.toggleComplete('Completed task');

    await todoPage.setStatusFilter('completed');

    const completedVisible = await todoPage.isTaskVisible('Completed task');
    expect(completedVisible).toBe(true);

    const activeVisible = await todoPage.isTaskVisible('Active task');
    expect(activeVisible).toBe(false);
  });

  test('sort tasks by title A–Z', async () => {
    await todoPage.addTask('Zebra task');
    await todoPage.addTask('Apple task');

    await todoPage.setSortBy('title_asc');

    const names = await todoPage.getTaskNames();
    const appIndex = names.findIndex(n => n.includes('Apple task'));
    const zebIndex = names.findIndex(n => n.includes('Zebra task'));
    expect(appIndex).toBeLessThan(zebIndex);
  });
});
