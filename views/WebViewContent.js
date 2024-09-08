const { getWebviewUri } = require('../helpers/utilityMethods');

function getWebviewContent(webView, context, todoListSavedData) {
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
        ${todoListSavedData.items?.map(item => TodoItem(item)).join('')}      
        <script src="${getWebviewUri(webView, context.extensionUri, './controllers/extension.controller.js')}"></script>
      </body>
    </html>
  `;
}

const TodoItem = (item) => {
  return `
          <div class="todo-item ${item.checked ? 'checked' : ''}">
            <input type="checkbox" id="${item.id}" ${item.checked ? "checked" : ""} class="todo-checkbox">
            <label for="${item.id}" class="todo-label">${item.label}</label>
            <button class="editTask" id="${item.id}">✎</button>
            <button class="deleteTask" id="${item.id}">✖</button>
          </div>
        `;
}

module.exports = {
  getWebviewContent
};
