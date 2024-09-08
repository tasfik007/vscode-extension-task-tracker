const path = require('path');
const vscode = require('vscode');
const TodoListDrawer = require('./services/TodoListDrawer');
const { getWebviewContent } = require('./views/WebViewContent');

let panel = {};

function activate(context) {
	const todoListDrawer = new TodoListDrawer(context);
	const treeView = vscode.window.createTreeView('todoTreeView', { treeDataProvider: todoListDrawer });

	// Specific todolist selected (specific tab is opened)
	context.subscriptions.push(
		vscode.commands.registerCommand('todo-list.openWebviewCommand', (todoList) => {
			let todoListSavedData = todoListDrawer.getItemById(todoList.id);

			// Focus existing panel if it exists
			if (panel[todoList.id]) {
				panel[todoList.id].webview.html = getWebviewContent(panel[todoList.id].webview, context, todoListSavedData);
				panel[todoList.id].reveal(vscode.ViewColumn.One);
				return;
			}

			// Create new webview panel (new tab)
			panel[todoList.id] = vscode.window.createWebviewPanel(
				'checkboxView',
				todoList.label,
				vscode.ViewColumn.One,
				{ enableScripts: true }
			);
			panel[todoList.id].webview.html = getWebviewContent(panel[todoList.id].webview, context, todoListSavedData);

			// Toggle todo item
			panel[todoList.id].webview.onDidReceiveMessage(
				async message => {
					switch (message.command) {
						case 'toggleCheckbox':
							todoListDrawer.updateList(todoList.id, message);
							vscode.commands.executeCommand('todo-list.openWebviewCommand', todoListDrawer.getItemById(todoList.id));
							vscode.window.showInformationMessage(`Checkbox is now ${message.checked ? 'checked' : 'unchecked'}`);
							break;
						case 'addTodo':
							const taskName = await vscode.window.showInputBox({
								prompt: 'Enter task name',
								placeHolder: 'Enter task name',
								value: ''
							});
							todoListDrawer.addTask(todoList.id, taskName);
							vscode.commands.executeCommand('todo-list.openWebviewCommand', todoListDrawer.getItemById(todoList.id));
							break;
						case 'deleteTodo':
							todoListDrawer.removeTask(todoList.id, message.id);
							vscode.commands.executeCommand('todo-list.openWebviewCommand', todoListDrawer.getItemById(todoList.id));
							break;
						case 'editTodo':
							const newTaskName = await vscode.window.showInputBox({
								prompt: 'Enter task name',
								placeHolder: 'Enter task name',
								value: todoList.items.find(item => item.id === message.id).label
							});
							todoListDrawer.editTask(todoList.id, message.id, newTaskName);
							vscode.commands.executeCommand('todo-list.openWebviewCommand', todoListDrawer.getItemById(todoList.id));
							break;
					}
				},
				undefined,
				context.subscriptions
			);

			// Handle webview focus changes (tab focus changes)
			panel[todoList.id].onDidChangeViewState(
				e => {
					if (e.webviewPanel.visible) {
						const currentTodoLists = context.globalState.get('todoLists', []);
						const currentSelectedList = currentTodoLists.find(list => list.id === todoList.id) || {};
						e.webviewPanel.webview.html = getWebviewContent(e.webviewPanel.webview, context, currentSelectedList);

						// Find the corresponding tree todoList and update the selection
						treeView.reveal(currentSelectedList, { focus: true, select: true });
					}
				},
				null,
				context.subscriptions
			);

			panel[todoList.id].onDidDispose(() => {
				panel[todoList.id] = null;
			}, null, context.subscriptions);
		})
	);

	// Delete List
	context.subscriptions.push(
		vscode.commands.registerCommand('todo-list.deleteList', (selectedList) => {
			panel[selectedList.id]?.dispose();
			todoListDrawer.removeList(selectedList);
			vscode.window.showInformationMessage(`Deleted ${selectedList.label}`);
		}));

	// Add List
	context.subscriptions.push(
		vscode.commands.registerCommand('todo-list.addItem', () => {
			let newlyAddedList = todoListDrawer.addList();
			treeView.reveal(newlyAddedList, { focus: true, select: true });
			vscode.commands.executeCommand('todo-list.openWebviewCommand', newlyAddedList);
			vscode.window.showInformationMessage(`New List Added`);
		}));

	// Export
	context.subscriptions.push(
		vscode.commands.registerCommand('todo-list.export', () => {
			const dataToCopy = JSON.stringify(todoListDrawer.getChildren(), null, 2);

			vscode.env.clipboard.writeText(dataToCopy).then(() => {
				vscode.window.showInformationMessage('Data copied to clipboard!');
			}, (error) => {
				console.error('Failed to copy: ', error);
				vscode.window.showErrorMessage('Failed to copy data to clipboard.');
			});
		}));

	// Import
	context.subscriptions.push(
		vscode.commands.registerCommand('todo-list.import', async () => {

			// Show a warning that existing data will be replaced
			const warningResult = await vscode.window.showWarningMessage(
				'Importing will replace all existing todo lists. Do you want to continue?',
				'Yes', 'No'
			);

			if (warningResult !== 'Yes') {
				return; // User chose not to proceed
			}
			const importedContent = await vscode.window.showInputBox({
				prompt: 'Paste your exported todo list content here',
				placeHolder: 'Paste JSON content...',
				multiline: true
			});

			if (!importedContent) {
				return; // User cancelled or didn't input anything
			}
			try {
				// Parse the imported content
				const importedData = JSON.parse(importedContent);

				// Validate the imported data structure (you may want to add more thorough validation)
				if (!Array.isArray(importedData)) {
					throw new Error('Invalid import data structure');
				}

				// Replace the global state with the imported content
				context.globalState.update('todoLists', importedData);

				// Refresh the tree view to reflect the imported data
				vscode.commands.executeCommand('workbench.action.reloadWindow');

				vscode.window.showInformationMessage('Todo lists imported successfully!');
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to import: ${error.message}`);
			}
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('todo-list.renameList', async (selectedList) => {
			const newName = await vscode.window.showInputBox({
				prompt: 'Enter new name for the list',
				placeHolder: selectedList.label,
				value: selectedList.label
			});
			let updatedList;
			if (newName && newName !== selectedList.label) {
				updatedList = todoListDrawer.renameList(selectedList, newName);
				// If there's an open panel for this item, update its title
				if (panel[selectedList.id]) {
					panel[selectedList.id].title = newName;
				}
			}
			treeView.reveal(updatedList, { focus: true, select: true });
			vscode.commands.executeCommand('todo-list.openWebviewCommand', updatedList);
		})
	);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
};
