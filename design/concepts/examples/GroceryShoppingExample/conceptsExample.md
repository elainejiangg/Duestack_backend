
**Idea:** *Separation of concerns* — plan what to buy (ShoppingList) vs. track what’s done (ToDoList)

---

## **Concept: ShoppingList** `[User]`

### **Purpose**
Plan out what items (and how much of each) you need to shop for.

### **Principle**
Each user can create one or more shopping lists and add desired items to the lists.  
They can also combine multiple shopping lists together, with item quantities aggregated.

### **State**
- **ShoppingLists**
  - `User`
  - `name: String`
  - `items: Set<Item>`
- **Items**
  - `name: String`
  - `quantity: Number`
  - `unit: String`

### **Actions**
#### `createList(user: User, name: String): ShoppingList`
- **Effects:** Adds a new shopping list.

#### `addItem(list: ShoppingList, name: String, quantity: Number, unit: String)`
- **Requires:**  
  - `list` exists  
  - `quantity > 0`
- **Effects:**  
  - If an item with the same name and unit already exists, increase its quantity.  
  - Else, create a new item and add it to the list.

#### `removeItem(list: ShoppingList, name: String, quantity: Number, unit: String)`
- **Requires:**  
  - `list` exists  
  - Item with same name and unit exists  
  - Item’s quantity ≥ specified quantity
- **Effects:**  
  - If specified quantity < existing quantity → decrement quantity  
  - Else → remove the item

#### `mergeLists(user: User, lists: Set<ShoppingList>): ShoppingList`
- **Requires:** All lists exist.  
- **Effects:**  
  - Creates a new list combining all items.  
  - If two or more lists share items with the same name and unit, sum their quantities.

---

## **Concept: ToDoList** `[User, Task]`

### **Purpose**
Track which tasks need to be done and which are complete.

### **Principle**
Each user can create one or more to-do lists.  
Each list contains tasks, and each task can be marked *done* or *undone*.

### **State**
- **ToDoLists**
  - `User`
  - `name: String`
  - `tasks: Set<Task>`
- **Tasks**
  - `description: String`
  - `status: Flag` *(done / undone)*

### **Actions**
#### `createToDoList(user: User, name: String): ToDoList`
- **Effects:** Adds a new empty to-do list.

#### `addTask(list: ToDoList, taskDescription: String)`
- **Requires:** `list` exists.  
- **Effects:** Creates a new task (status = undone) and adds it to the list.

#### `removeTask(list: ToDoList, task: Task)`
- **Requires:** `list` exists and `task` belongs to it.  
- **Effects:** Removes the task from the list.

#### `markTaskDone(task: Task)`
- **Requires:** `task` exists.  
- **Effects:** Sets task status → done.

#### `markTaskUndone(task: Task)`
- **Requires:** `task` exists.  
- **Effects:** Sets task status → undone.

---

## **Sync: exportToDo**

**When:** `Request.exportShoppingList(shoppingList)`  
**Then:**
1. `ToDoList.createToDoList(user: shoppingList.User, name: shoppingList.name): todoList`
2. For each `item` in `shoppingList.items`:  
   `ToDoList.addTask(list: todoList, taskDescription: item.name + item.quantity + item.unit)`
