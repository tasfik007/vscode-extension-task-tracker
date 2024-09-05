const vscode = require('vscode');
const path = require('path');

class TodoTreeDataProvider {
  constructor(context) {
    this.context = context;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.items = []; // Store these to access later
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

  addElement() {
    const id = this.items.length + 1;
    const newList = { id, label: "Todo List "+id, items: [
		{id: 1, label: "Todo Item 01", checked: false},
		{id: 2, label: "Todo Item 02", checked: false}
	] };
    this.items.push(newList);
	this.context.globalState.update('todoLists', this.items);
	this.context.globalState.update(id, newList);
    this.refresh();
	return newList;
  }

  removeElement(selectedItem) {
	this.items = this.items.filter(item => item.id !== selectedItem.id);
	this.context.globalState.update('todoLists', this.items);
	this.refresh();
  }

  getChildren() {
    return this.items;
  }

  getParent(element) {
    return null; // Since our items are at the root level, they have no parent
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  // Function to get an item by ID
  getItemById(id) {
    return this.items.find(item => item.id === id);
  }
}

let panel = {};

function activate(context) {
  const treeDataProvider = new TodoTreeDataProvider(context);
  const todoLists = context.globalState.get('todoLists', []);
  treeDataProvider.items = todoLists;
  
  const treeView = vscode.window.createTreeView('todoTreeView', { treeDataProvider });

  context.subscriptions.push(
    vscode.commands.registerCommand('todo-list.openWebviewCommand', (item) => {
	  let selectedList = context.globalState.get(item.id, {});
	  console.log("selectedList: ", selectedList);
	  console.log("item: ", item);
	  
      // Focus existing panel if it exists
      if (panel[item.id]) {
        panel[item.id].webview.html = getWebviewContent(panel[item.id].webview, context, selectedList);
        panel[item.id].reveal(vscode.ViewColumn.One);
        return;
      }

      // Create new webview panel
      panel[item.id] = vscode.window.createWebviewPanel(
        'checkboxView',
        item.label,
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel[item.id].webview.html = getWebviewContent(panel[item.id].webview, context, selectedList);

      panel[item.id].webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'toggleCheckbox':
              vscode.window.showInformationMessage(`Checkbox is now ${message.checked ? 'checked' : 'unchecked'}`);
			  const updatedItem = {...selectedList, items: selectedList.items?.map(item => item.id===message.id ? 
				{...item, checked: message.checked ? true : false} : 
				item
			)};
              context.globalState.update(item.id, updatedItem);
              break;
          }
        },
        undefined,
        context.subscriptions
      );

      // Handle webview focus changes
      panel[item.id].onDidChangeViewState(
        e => {
          if (e.webviewPanel.visible) {
            let selectedList = context.globalState.get(item.id, item);
            e.webviewPanel.webview.html = getWebviewContent(e.webviewPanel.webview, context, selectedList);

            // Find the corresponding tree item and update the selection
            treeView.reveal(item, { focus: true, select: true });
          }
        },
        null,
        context.subscriptions
      );

      panel[item.id].onDidDispose(() => {
        panel[item.id] = null;
      }, null, context.subscriptions);
    })
  );

  context.subscriptions.push(
	vscode.commands.registerCommand('todo-list.deleteList', (selectedList) => {
	  // Handle item editing
	  panel[selectedList.id]?.dispose();
	  context.globalState.update(selectedList.id, {});
	  treeDataProvider.removeElement(selectedList);
	  vscode.window.showInformationMessage(`Deleted ${selectedList.label}`);
	}));

  context.subscriptions.push(
	vscode.commands.registerCommand('todo-list.addItem', () => {
	  // Handle Add item
	  let newlyAddedList = treeDataProvider.addElement();
	  treeView.reveal(newlyAddedList, { focus: true, select: true });
	  vscode.commands.executeCommand('todo-list.openWebviewCommand', newlyAddedList);
	  vscode.window.showInformationMessage(`New List Added`);
	}));

}

function getWebviewUri(webview, context, relativePath) {
	const mediaPath = vscode.Uri.joinPath(context.extensionUri, relativePath);
    return webview.asWebviewUri(mediaPath);
  }
  

function getWebviewContent(webView, context, selectedList) {
	const itemsHtml = selectedList.items?.map(item => {
		return `
		  <label>
			<input type="checkbox" id="${item.id}" ${item.checked ? "checked" : ""}>
			${item.label}
		  </label>
		`;
	  }).join('');
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${selectedList.label}</title>
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
      <h2>${selectedList.label}</h2>
      ${itemsHtml}
      <script src="${getWebviewUri(webView, context, 'extensionController.js')}"></script>
    </body>
    </html>
  `;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
