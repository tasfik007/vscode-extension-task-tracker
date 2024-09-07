const vscode = require('vscode');
const path = require('path');

/**
 * TODO: 
 * 0. Refactor code
 * 1. Add a button in list webview
 * 2. Add an item in a list dynamically
 * 3. Store the state of newly added item in global state
 * 4. Take input list name
 * 5. Take input item name
 * 6. Add a delete button in list webview
 * 7. Remove item from a list
 * 8. Edit list name
 * 9. Edit item name
 * 10. Add export functionality
 * 11. Add import functionality
 * 
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
			id, label: "Todo List " + id, items: [
				{ id: 1, label: "Todo Item 01", checked: false },
				{ id: 2, label: "Todo Item 02", checked: false }
			]
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
		return updatedTodoList;
	}

	removeList(listToBeRemoved) {
		this.todoLists = this.todoLists.filter(item => item.id !== listToBeRemoved.id);
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
				message => {
					switch (message.command) {
						case 'toggleCheckbox':
							const updatedList = todoListDrawer.updateList(todoList.id, message);
							vscode.commands.executeCommand('todo-list.openWebviewCommand', updatedList);
							vscode.window.showInformationMessage(`Checkbox is now ${message.checked ? 'checked' : 'unchecked'}`);
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
      <h2>${todoListSavedData.label}</h2>
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
