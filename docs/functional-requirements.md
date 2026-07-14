# Functional Requirements

## Overview

This document outlines the functional requirements for the task management features of the application.

## Features

### 1. Add a Due Date to a Task

- Users can optionally assign a due date when creating a new task.
- Users can add or update the due date of an existing task.
- Due dates are displayed alongside the task title.
- Tasks with past due dates are visually distinguished (e.g., highlighted or labeled as overdue).
- Due dates are stored in ISO 8601 format (`YYYY-MM-DD`).

### 2. Edit a Task

- Users can edit the title of an existing task.
- Users can edit the due date of an existing task.
- Changes are saved immediately upon confirmation.
- Editing can be cancelled without saving changes.

### 3. Sort Tasks

- Users can sort tasks by:
  - **Due date** (ascending or descending)
  - **Creation date** (ascending or descending)
  - **Title** (alphabetical, A–Z or Z–A)
- The selected sort order persists during the current session.

### 4. Filter Tasks

- Users can filter tasks by:
  - **Status**: All, Active, Completed
  - **Due date range**: Overdue, Due today, Due this week, No due date
- Multiple filters can be applied simultaneously.
- An active filter is clearly indicated in the UI.
- Filters can be cleared individually or all at once.
