const { getWebviewUri } = require('../helpers/utilityMethods');

function getWebviewContent(webView, context, todoListSavedData) {
    const itemsHtml = todoListSavedData.items?.map(item => {
        return `
          <div class="todo-item ${item.checked ? 'checked' : ''}">
            <input type="checkbox" id="${item.id}" ${item.checked ? "checked" : ""} class="todo-checkbox">
            <label for="${item.id}" class="todo-label">${item.label}</label>
            <button class="editTask" id="${item.id}">✎</button>
            <button class="deleteTask" id="${item.id}">✖</button>
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
      <link rel="stylesheet" href="${getWebviewUri(webView, context.extensionUri, './resources/styles/main.css')}">
    </head>
    <body>
      <div class="header">
        <h2 class="title">${todoListSavedData.label}</h2>
        <button id="addTodo" class="add-button">Add Task</button>
      </div>
      ${itemsHtml}      
      <script src="${getWebviewUri(webView, context.extensionUri, './controllers/extension.controller.js')}"></script>
    </body>
    </html>
  `;
}

module.exports = {
    getWebviewContent
};
