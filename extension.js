const vscode = require('vscode');

class TodoTreeDataProvider {
  constructor(context) {
    this.context = context;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.items = [
      { id: 1, label: "Todo List 1" },
      { id: 2, label: "Todo List 2" }
    ]; // Store these to access later
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
    const newItem = { id, label: "Todo List "+id };
    this.items.push(newItem);
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
  
  const treeView = vscode.window.createTreeView('todoTreeView', { treeDataProvider });

  context.subscriptions.push(
    vscode.commands.registerCommand('todo-list.openWebviewCommand', (item) => {
	  let isChecked = context.globalState.get('isChecked#' + item.id, false);
	  
      // Focus existing panel if it exists
      if (panel[item.id]) {
        panel[item.id].webview.html = getWebviewContent(isChecked, item);
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

      panel[item.id].webview.html = getWebviewContent(isChecked, item);

      panel[item.id].webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'toggleCheckbox':
              vscode.window.showInformationMessage(`Checkbox is now ${message.checked ? 'checked' : 'unchecked'}`);
              context.globalState.update('isChecked#' + item.id, message.checked ? true : false);
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
            const isChecked = context.globalState.get('isChecked#' + item.id, false);
            e.webviewPanel.webview.html = getWebviewContent(isChecked, item);

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
	vscode.commands.registerCommand('todo-list.editItem', (item) => {
	  // Handle item editing
	  vscode.window.showInformationMessage(`Edit item ${item.label}`);
	}));

  context.subscriptions.push(
	vscode.commands.registerCommand('todo-list.addItem', () => {
	  // Handle Add item
	  treeDataProvider.addElement();
	  vscode.window.showInformationMessage(`New List Added`);
	}));

}

function getWebviewContent(isChecked, item) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${item.label}</title>
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
      <h2>${item.label}</h2>
      <label>
        <input type="checkbox" id="checkbox" ${isChecked ? 'checked' : ''}>
        Todo Item 01
      </label>
      <script>
        const vscode = acquireVsCodeApi();
        document.getElementById('checkbox').addEventListener('change', (event) => {
          vscode.postMessage({
            command: 'toggleCheckbox',
            checked: event.target.checked
          });
        });
      </script>
    </body>
    </html>
  `;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
