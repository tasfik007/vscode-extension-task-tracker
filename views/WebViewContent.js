const { getWebviewUri } = require('../helpers/utilityMethods');

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
      <script src="${getWebviewUri(webView, context.extensionUri, 'extensionController.js')}"></script>
    </body>
    </html>
  `;
}

module.exports = {
    getWebviewContent
};
