// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "todo-list" is now active!');

	const isChecked = context.globalState.get('isChecked');
	console.log("Checked: ", isChecked);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('todo-list.todo', function () {
		// The code you place here will be executed every time your command is executed
		const panel = vscode.window.createWebviewPanel(
			'checkboxView', // Identifies the type of the webview
			'Checkbox View', // Title of the panel
			vscode.ViewColumn.One, // Editor column to show the new webview panel
			{
				enableScripts: true // Allow scripts to run in the webview
			} // Webview options
		  );
	  
		  // Set the HTML content of the webview
		  panel.webview.html = getWebviewContent({isChecked});
		  
		  // Handle messages from the webview
		  panel.webview.onDidReceiveMessage(
			message => {
			  switch (message.command) {
				case 'toggleCheckbox':
				  vscode.window.showInformationMessage(`Checkbox is now ${message.checked ? 'checked' : 'unchecked'}`);
				  context.globalState.update('isChecked', message.checked ? true : false );
				  break;
			  }
			},
			undefined,
			context.subscriptions
		  );

		// Display a message box to the user
		// vscode.window.showInformationMessage('Welcome to Tasfik\'s todo-list extension!');
		
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent(data) {
	return `
	  <!DOCTYPE html>
	  <html lang="en">
	  <head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Checkbox View</title>
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
		<h2>Checkbox Example</h2>
		<label>
		  <input type="checkbox" id="checkbox" ${data.isChecked ? 'checked' : ''}>
		  Toggle me!
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

  

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
