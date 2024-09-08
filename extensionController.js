(function() {
    const vscode = acquireVsCodeApi();  
    function setupCheckboxes() {
      document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
          vscode.postMessage({
            command: 'toggleCheckbox',
            id: Number(event.target.id),
            checked: event.target.checked
          });
        });
      });
    }  
    function addTask() {
        document.getElementById('addTodo').addEventListener('click', (event) => {
          vscode.postMessage({
            command: 'addTodo',
          });
        });
    }  
    function deleteTask() {
      document.querySelectorAll('.deleteTask').forEach(btn => {
        btn.addEventListener('click', (event) => {
          vscode.postMessage({
            command: 'deleteTodo',
            id: Number(event.target.id),
          });
        });
      });
    }  
    function editTask() {
      document.querySelectorAll('.editTask').forEach(btn => {
        btn.addEventListener('click', (event) => {
          vscode.postMessage({
            command: 'editTodo',
            id: Number(event.target.id),
          });
        });
      });
    } 
    setupCheckboxes();
    addTask();
    deleteTask();
    editTask();
  })();
  