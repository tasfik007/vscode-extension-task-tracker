const vscode = require('vscode');
const path = require('path');

/**
 * TODO: 
 * 0. Refactor code ✅
 * 1. Add a button in list webview ✅
 * 2. Add an item in a list dynamically ✅
 * 3. Store the state of newly added item in global state ✅
 * 4. Take input list name ❌
 * 5. Take input item name ✅
 * 6. Add a delete button in list webview ✅
 * 7. Remove item from a list ✅
 * 8. Edit list name ✅
 * 9. Edit item name ✅
 * 10. Add export functionality
 * 11. Add import functionality
 * 12. Make code presentable
 * 
 */

class TodoListDrawer {
	constructor(context) {
		this.context = context;
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
		// Fetch already saved todo lists and their data from global context
		this.todoLists = context.globalState.get('todoLists', []) || [];
	}

	getTreeItem(element) {
		const treeItem = new vscode.TreeItem(element.label);
		treeItem.iconPath = new vscode.ThemeIcon('output');
		treeItem.command = {
			command: "todo-list.openWebviewCommand",
			title: "Open details",
			arguments: [element]
		};
		return treeItem;
	}

	getChildren() {
		return this.todoLists;
	}

	getParent(element) {
		return null; // Since our items are at the root level, they have no parent
	}

	refresh() {
		this._onDidChangeTreeData.fire();
	}

	getItemById(id) {
		return this.todoLists.find(item => item.id === id);
	}

	addList() {
		const id = `uid-${Date.now()}`;
		const newList = {
			id, label: "Todo List " + id, items: []
		};
		this.todoLists.push(newList);
		this.context.globalState.update('todoLists', this.todoLists);
		this.refresh();
		return newList;
	}

	renameList(listToBeRenamed, newLabel) {
		const updatedList = {...listToBeRenamed, label: newLabel};
		this.todoLists = this.todoLists.map(item => item.id === listToBeRenamed.id ? updatedList : item);
		this.context.globalState.update('todoLists', this.todoLists);
		this.refresh();
		return updatedList;
	  }

	updateList(id, message) {
		const listToBeUpdated = this.getItemById(id);
		const updatedItems = listToBeUpdated.items?.map(item => item.id === message.id ?
			{ ...item, checked: message.checked ? true : false } :
			item
		);
		const updatedTodoList = {
			...listToBeUpdated, items: updatedItems
		};
		this.todoLists = this.todoLists.map(tl => tl.id === listToBeUpdated.id ? updatedTodoList : tl);
		this.context.globalState.update('todoLists', this.todoLists);
	}

	removeList(listToBeRemoved) {
		this.todoLists = this.todoLists.filter(item => item.id !== listToBeRemoved.id);
		this.context.globalState.update('todoLists', this.todoLists);
		this.refresh();
	}

	addTask(listId, label) {
		const selectedList = this.getItemById(listId);
		const newTask = { id: selectedList.items.length + 1, label, checked: false };
		selectedList.items.push(newTask);
		this.todoLists = this.todoLists.map(item => item.id === selectedList.id ? selectedList : item);
		this.context.globalState.update('todoLists', this.todoLists);
		this.refresh();
	}

	removeTask(listId, taskId) {
		const selectedList = this.getItemById(listId);
		selectedList.items = selectedList.items.filter(item => item.id !== taskId);
		this.todoLists = this.todoLists.map(item => item.id === selectedList.id ? selectedList : item);
		this.context.globalState.update('todoLists', this.todoLists);
		this.refresh();
	}
	editTask(listId, taskId, content) {
		const selectedList = this.getItemById(listId);
		selectedList.items = selectedList.items.map(item => item.id === taskId ? {...item, label: content} : item);
		this.todoLists = this.todoLists.map(item => item.id === selectedList.id ? selectedList : item);
		this.context.globalState.update('todoLists', this.todoLists);
		this.refresh();
	}

}

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

function getWebviewUri(webview, context, relativePath) {
	const mediaPath = vscode.Uri.joinPath(context.extensionUri, relativePath);
	return webview.asWebviewUri(mediaPath);
}


function getWebviewContent(webView, context, todoListSavedData) {
	const itemsHtml = todoListSavedData.items?.map(item => {
		return `
		  <div style="
        background-color: #f0f0f0;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 10px;
        padding: 10px;
        display: flex;
        align-items: center;
      ">
        <input type="checkbox" id="${item.id}" ${item.checked ? "checked" : ""} style="
          margin-right: 10px;
          width: 18px;
          height: 18px;
        ">
        <label for="${item.id}" style="
          font-size: 16px;
          flex-grow: 1;
		  color: black;
          font-weight: bold;
          ${item.checked ? "text-decoration: line-through; color: #888;" : ""}
        ">${item.label}</label>
		<button class="editTask" id="${item.id}" style="
          padding: 5px 10px;
          cursor: pointer;
          background-color: transparent;
          color: #007bff;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          margin-right: 10px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">✎</button>
		<button class="deleteTask" id="${item.id}" style="
        background-color: transparent;
        color: #ff4d4d;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 0 5px;
        line-height: 1;
      ">✖</button>
    </div>
      </div>
		`;
	}).join('');
	return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${todoListSavedData.label}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          padding: 10px;
        }
        label {
          display: block;
          font-size: 18px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      ">
        <h2 style="
          margin: 0;
          font-size: 18px;
        ">${todoListSavedData.label}</h2>
        <button id="addTodo" style="
          padding: 5px 10px;
          cursor: pointer;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
        ">Add Task</button>
      </div>
      ${itemsHtml}
      <script src="${getWebviewUri(webView, context, 'extensionController.js')}"></script>
    </body>
    </html>
  `;
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
};
