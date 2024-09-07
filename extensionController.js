(function() {
    const vscode = acquireVsCodeApi();  
    function setupCheckboxes() {
      document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
          vscode.postMessage({
            command: 'toggleCheckbox',
            id: event.target.id,
            checked: event.target.checked
          });
        });
      });
    }  
    setupCheckboxes();
  })();
  