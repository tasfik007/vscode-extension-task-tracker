(function() {
    const vscode = acquireVsCodeApi();
  
    // Add event listeners to checkboxes
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
  
    // Initialize
    setupCheckboxes();
  })();
  