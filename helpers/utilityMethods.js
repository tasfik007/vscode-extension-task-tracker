const vscode = require('vscode');

function getWebviewUri(webview, extensionUri, relativePath) {
	const mediaPath = vscode.Uri.joinPath(extensionUri, relativePath);
	return webview.asWebviewUri(mediaPath);
}

module.exports = {
	getWebviewUri
};
