var currentList;

/**
 * This function builds the list of to do lists used in the drawer in the
 * main screen.
 */
function refreshToDoLists() {
    if (!db) {
        // HACK:
        // this condition may happen upon first time use when the
        // indexDB storage is under creation and refreshToDoLists()
        // is called. Simply waiting for a bit longer before trying again
        // will make it work.
        console.warn("Database is not ready yet");
        setTimeout(refreshToDoLists, 1000);
        return;
    }
    console.log("Refreshing to do lists");

    var todoListsContainer = document.getElementById("todolists");


    while (todoListsContainer.hasChildNodes()) {
        todoListsContainer.removeChild(todoListsContainer.lastChild);
    }

    getAllLists(function (err, value) {
        var memoItem = document.createElement("li");
        var memoP = document.createElement("a");
        var memoTitle = document.createTextNode(value.title);

        memoItem.addEventListener("click", function () {
            console.log("Clicked to do list #" + value.id);
            showToDoList(value);
            window.location = "#"; // <-- this is used to close the drawer
        });

        memoP.appendChild(memoTitle);
        memoItem.appendChild(memoP);
        todoListsContainer.appendChild(memoItem);


    });
}

/**
 * Picks a given to do list and displays it in the main screen.
 * @param inList
 */
function showToDoList(inList) {
    var listNameContainer = document.querySelector(".list-name"),
        listContentContainer = document.querySelector("#todo-list");

    listNameContainer.innerHTML = inList.title;

    while (listContentContainer.hasChildNodes()) {
        listContentContainer.removeChild(listContentContainer.lastChild);
    }

    for (var i = 0, len = inList.items.length; i < len; i++) {
        var todoItem = inList.items[i];
        appendItemToListDisplay(todoItem, i);
    }

    currentList = inList;
}
/**
 * This appends an item to the list display. It is used by showToDoList() to build the
 * main list display
 * @param inItem
 * @param inIndex
 */
function appendItemToListDisplay(inItem, inIndex) {
    var listContentContainer = document.querySelector("#todo-list"),
        template = '<label class="danger"><input type="checkbox"><span></span></label><a href="#"><p>'+inItem.content+'</p><p><time>5:43PM</time></p></a>',
        listItem = document.createElement("li");

    listItem.innerHTML = template;

    listItem.querySelector("input").checked = inItem.completed;

    listItem.querySelector("input").addEventListener("click", function(e) {
        inItem.completed = listItem.querySelector("input").checked
        currentList.items[inIndex] = inItem;
        saveToDoList(currentList, function(err, succ){
            if (!err) {
                console.log("list saved.");
                currentList.id = succ;
            }
        });
    });

    listContentContainer.appendChild(listItem);
}

/**
 * Creates a new to do list. The list is saved after creation and displayed on the
 * main screen.
 */
function createNewList() {
    var listTitle = window.prompt("Name your new To Do list", "Untitled List");
    var list = new ToDoList(listTitle);

    saveToDoList(list, function(err, succ) {
        if (!err) {
            list.id = succ;
            refreshToDoLists();
            showToDoList(list);
        }
    });
}

/**
 * Renames the current displayed list. This is achieved by clicking on the title in the
 * main screen.
 */
function renameCurrentList() {
    var listTitle = window.prompt("Rename this To Do list", currentList.title);

    currentList.title = listTitle;

    saveToDoList(currentList, function(err, succ) {
        if (!err) {
            currentList.id = succ;
            refreshToDoLists();
            showToDoList(currentList);
        }
    });
}


function addNewTodoItem() {
    document.querySelector('#todo-item-detail').className = 'current';
    document.querySelector('[data-position="current"]').className = 'left';
}

window.onload = function () {
    console.log("starting the application...");

    // drawer events
    document.querySelector("#create-new-list").addEventListener("click", createNewList);

    // main screen events
    document.querySelector(".list-name").addEventListener("click", renameCurrentList);
    document.querySelector('#add-new-todo-item').addEventListener ('click', addNewTodoItem);

    // to do item details events
    document.querySelector('#back-to-list').addEventListener ('click', function () {
        document.querySelector('#todo-item-detail').className = 'right';
        document.querySelector('[data-position="current"]').className = 'current';
    });



    // the entry point for the app is the following command
    refreshToDoLists();

};