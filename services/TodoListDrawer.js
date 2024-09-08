const vscode = require('vscode');

class TodoListDrawer {
	constructor(context) {
		this.context = context;
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
		// Fetch already saved todo lists and their data from global context
		this.todoLists = context.globalState.get('todoLists', []) || [];
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

	getChildren() {
		return this.todoLists;
	}

	getParent(element) {
		return null; // Since our items are at the root level, they have no parent
	}

	refresh() {
		this._onDidChangeTreeData.fire();
	}

	getItemById(id) {
		return this.todoLists.find(item => item.id === id);
	}

	addList() {
		const id = `uid-${Date.now()}`;
		const newList = {
			id, label: "Todo List " + id, items: []
		};
		this.todoLists.push(newList);
		this.context.globalState.update('todoLists', this.todoLists);
		this.refresh();
		return newList;
	}

	renameList(listToBeRenamed, newLabel) {
		const updatedList = {...listToBeRenamed, label: newLabel};
		this.todoLists = this.todoLists.map(item => item.id === listToBeRenamed.id ? updatedList : item);
		this.context.globalState.update('todoLists', this.todoLists);
		this.refresh();
		return updatedList;
	  }

	updateList(id, message) {
		const listToBeUpdated = this.getItemById(id);
		const updatedItems = listToBeUpdated.items?.map(item => item.id === message.id ?
			{ ...item, checked: message.checked ? true : false } :
			item
		);
		const updatedTodoList = {
			...listToBeUpdated, items: updatedItems
		};
		this.todoLists = this.todoLists.map(tl => tl.id === listToBeUpdated.id ? updatedTodoList : tl);
		this.context.globalState.update('todoLists', this.todoLists);
	}

	removeList(listToBeRemoved) {
		this.todoLists = this.todoLists.filter(item => item.id !== listToBeRemoved.id);
		this.context.globalState.update('todoLists', this.todoLists);
		this.refresh();
	}

	addTask(listId, label) {
		const selectedList = this.getItemById(listId);
		const newTask = { id: selectedList.items.length + 1, label, checked: false };
		selectedList.items.push(newTask);
		this.todoLists = this.todoLists.map(item => item.id === selectedList.id ? selectedList : item);
		this.context.globalState.update('todoLists', this.todoLists);
		this.refresh();
	}

	removeTask(listId, taskId) {
		const selectedList = this.getItemById(listId);
		selectedList.items = selectedList.items.filter(item => item.id !== taskId);
		this.todoLists = this.todoLists.map(item => item.id === selectedList.id ? selectedList : item);
		this.context.globalState.update('todoLists', this.todoLists);
		this.refresh();
	}
	editTask(listId, taskId, content) {
		const selectedList = this.getItemById(listId);
		selectedList.items = selectedList.items.map(item => item.id === taskId ? {...item, label: content} : item);
		this.todoLists = this.todoLists.map(item => item.id === selectedList.id ? selectedList : item);
		this.context.globalState.update('todoLists', this.todoLists);
		this.refresh();
	}
}

module.exports = TodoListDrawer;
