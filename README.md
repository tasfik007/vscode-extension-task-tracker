# Todo List Extension for VS Code

## Overview

The Todo List extension for Visual Studio Code is a powerful tool to help you manage your tasks directly within your development environment. Keep track of your to-do items, and easily export or import your lists using the clipboard for quick sharing and backup.

## Features

- Create and manage todo lists within VS Code
- Add, edit, and delete tasks
- Mark tasks as complete or incomplete
- Export your todo lists to the clipboard
- Import todo lists from clipboard content
- Persistent storage of your todo lists
- Clean and intuitive user interface


## Installation

1. Open Visual Studio Code
2. Go to the Extensions view (Ctrl+Shift+X or Cmd+Shift+X on macOS)
3. Search for "Todo List"
4. Click Install

## Usage

1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P on macOS)
2. Type "Todo List" and select "Open Todo List"
3. Use the interface to add, edit, delete, and manage your tasks

### Exporting Todo Lists

1. Open your todo list in the extension
2. Click on the "Export" button
3. Your list will be copied to the clipboard as a JSON string
4. Paste the content wherever you need it (e.g., a text file, email, or another application)

### Importing Todo Lists

1. Copy the JSON string of your todo list to the clipboard
2. Open the Todo List extension
3. Click on the "Import" button
4. Your tasks will be imported from the clipboard content into the extension

## Extension Settings

This extension contributes the following settings:

* `todoList.enableNotifications`: Enable/disable notifications for task reminders.
* `todoList.defaultListName`: Set the default name for new todo lists.

## Known Issues

Currently, there are no known issues. If you encounter any problems, please file an issue on our GitHub repository.

## Release Notes

### 1.1.0

- Added export functionality to copy todo lists to clipboard as JSON
- Implemented import feature to load todo lists from clipboard content

### 1.0.0

Initial release of the Todo List extension:
- Basic task management functionality
- Persistent storage of todo lists
- Simple and clean user interface

## Feedback and Contributions

We welcome your feedback and contributions! Please visit our [GitHub repository](https://github.com/yourusername/todo-list-extension) to submit issues, feature requests, or pull requests.

---

**Enjoy staying organized with Todo List for VS Code!**
