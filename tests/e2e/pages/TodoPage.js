/**
 * Page Object Model for the To Do App.
 * All selectors and user actions are defined here.
 * Spec files import this class and call its methods — no raw selectors in tests.
 */
class TodoPage {
  constructor(page) {
    this.page = page;

    // Add task form
    this.taskNameInput = page.getByPlaceholder('Enter task name');
    this.dueDateInput = page.locator('form .date-input');
    this.addTaskButton = page.getByRole('button', { name: 'Add Task' });

    // Toolbar
    this.sortSelect = page.locator('#sort-select');
    this.statusFilterAll = page.getByRole('button', { name: 'All' });
    this.statusFilterActive = page.getByRole('button', { name: 'Active' });
    this.statusFilterCompleted = page.getByRole('button', { name: 'Completed' });
    this.dueDateFilterSelect = page.locator('#due-filter');
    this.clearFiltersButton = page.getByRole('button', { name: 'Clear all filters' });

    // Task list
    this.taskList = page.locator('ul[aria-live="polite"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForSelector('ul[aria-live="polite"]');
  }

  async addTask(name, dueDate = null) {
    await this.taskNameInput.fill(name);
    if (dueDate) {
      await this.dueDateInput.fill(dueDate);
    }
    await this.addTaskButton.click();
    await this.page.waitForFunction(
      (taskName) => {
        const items = document.querySelectorAll('li .task-name');
        return Array.from(items).some(el => el.textContent.includes(taskName));
      },
      name
    );
  }

  async getTaskNames() {
    const names = await this.page.locator('li .task-name').allTextContents();
    return names.map(n => n.trim());
  }

  async clickEditForTask(taskName) {
    const taskRow = this.page.locator('li').filter({ hasText: taskName });
    await taskRow.getByRole('button', { name: 'Edit' }).click();
  }

  async saveEdit(newName) {
    const nameInput = this.page.locator('.edit-fields input[type="text"]');
    await nameInput.clear();
    await nameInput.fill(newName);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async cancelEdit() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }

  async toggleComplete(taskName) {
    const taskRow = this.page.locator('li').filter({ hasText: taskName });
    await taskRow.locator('input[type="checkbox"]').click();
  }

  async deleteTask(taskName) {
    const taskRow = this.page.locator('li').filter({ hasText: taskName });
    await taskRow.getByRole('button', { name: /delete/i }).click();
    await this.page.waitForFunction(
      (name) => !Array.from(document.querySelectorAll('li .task-name')).some(el => el.textContent.includes(name)),
      taskName
    );
  }

  async setSortBy(value) {
    await this.sortSelect.selectOption(value);
  }

  async setStatusFilter(filter) {
    const buttons = { all: this.statusFilterAll, active: this.statusFilterActive, completed: this.statusFilterCompleted };
    await buttons[filter].click();
  }

  async setDueDateFilter(value) {
    await this.dueDateFilterSelect.selectOption(value);
  }

  async isTaskVisible(taskName) {
    return this.page.locator('li .task-name').filter({ hasText: taskName }).isVisible();
  }

  async isTaskCompleted(taskName) {
    const taskRow = this.page.locator('li').filter({ hasText: taskName });
    return taskRow.evaluate(el => el.classList.contains('completed'));
  }
}

module.exports = { TodoPage };
