/**
 * TO DO App
 *
 * OBJECTIVE
 *
 * Create a simple to do list management app to demonstrate some common features and functionalities used by
 * Firefox OS apps.
 *
 * WEB API USAGE
 *
 * This app uses IndexedDB to store its data, you can learn more about it at:
 * https://developer.mozilla.org/en-US/docs/IndexedDB/Using_IndexedDB
 *
 * It uses the Open Web Apps API to provide self-installation feature as documented at:
 * https://developer.mozilla.org/en-US/docs/Web/Apps/JavaScript_API?redirectlocale=en-US&redirectslug=JavaScript_API
 *
 * Alarms are scheduled using the Alarms API described at:
 * https://wiki.mozilla.org/WebAPI/AlarmAPI
 *
 */

var currentList, currentItemIndex;
var listDisplayMode = true;

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
        var listItem = document.createElement("li");
        var listLink = document.createElement("a");
        var listTitle = document.createTextNode(value.title);

        listItem.addEventListener("click", function () {
            console.log("Clicked to do list #" + value.id);
            showToDoList(value);
            window.location = "#"; // <-- this is used to close the drawer
        });

        listLink.appendChild(listTitle);
        listItem.appendChild(listLink);
        todoListsContainer.appendChild(listItem);


    });
}

/**
 * Picks a given to do list and displays it in the main screen.
 *
 * A to do list can be displayed in two modes: edit and display,
 * the first mode displays a button besides each item that the user
 * can click to edit the item. The second mode displayes a checkbox that the user
 * can click to mark an item done.
 *
 * @param inList
 * @param inMode
 */
function showToDoList(inList, inMode) {
    var listNameContainer = document.querySelector(".list-name"),
        listContentContainer = document.querySelector("#todo-list");

    inMode = inMode || "display";
    console.log("showing list in mode:", inMode);

    listNameContainer.innerHTML = inList.title;

    while (listContentContainer.hasChildNodes()) {
        listContentContainer.removeChild(listContentContainer.lastChild);
    }

    for (var i = 0, len = inList.items.length; i < len; i++) {
        var todoItem = inList.items[i];

        if (inMode === "display") {
            appendItemToListDisplay(todoItem, i);
        } else {
            appendEditableItemToListDisplay(todoItem, i);
        }
    }

    currentList = inList;
    console.log(JSON.stringify(currentList));
}

/**
 * This appends an item to the list display. It is used by showToDoList() to build the
 * main list display
 * @param inItem
 * @param inIndex
 */
function appendItemToListDisplay(inItem, inIndex) {
    var listContentContainer = document.querySelector("#todo-list"),
        listItem = document.createElement("li"),
        listLabel = document.createElement("label"),
        listInput = document.createElement("input"),
        listSpan = document.createElement("span"),
        listFirstParagraph = document.createElement("p"),
        listContent = document.createTextNode(inItem.content),
        listSecondParagraph = document.createElement("p"),
        listTime = document.createElement("time");


     /*
    listInput.setAttribute("type", "checkbox");
    listLabel.appendChild(listInput);
    listLabel.appendChild(listSpan);
    listItem.appendChild(listLabel);

    listFirstParagraph.appendChild(listContent);
    listSecondParagraph.appendChild(listTime);
    listItem.appendChild(listFirstParagraph);
    listInput.appendChild(listSecondParagraph);

    listItem.classList.add("todo-item");
    listItem.setAttribute("data-todo-index", inIndex);
    listItem.querySelector("input").checked = inItem.completed;
    */

    listFirstParagraph.appendChild(listContent);

    if (inItem.completed) {
        listFirstParagraph.classList.add("task-done");
        listFirstParagraph.classList.remove("task-open");
    } else {
        listFirstParagraph.classList.remove("task-done");
        listFirstParagraph.classList.add("task-open");
    }

    listItem.appendChild(listFirstParagraph);
    listContentContainer.appendChild(listItem);

    listItem.addEventListener("click", function(e) {
        inItem.completed = !inItem.completed;
        currentList.items[inIndex] = inItem;
        saveToDoList(currentList, function(err, succ){
            if (!err) {
                console.log("list saved.");
                currentList.id = succ;
            }
        });

        if (inItem.completed) {
            listFirstParagraph.classList.add("task-done");
            listFirstParagraph.classList.remove("task-open");
        } else {
            listFirstParagraph.classList.remove("task-done");
            listFirstParagraph.classList.add("task-open");
        }


        /*
        inItem.completed = listItem.querySelector("input").checked
        currentList.items[inIndex] = inItem;
        saveToDoList(currentList, function(err, succ){
            if (!err) {
                console.log("list saved.");
                currentList.id = succ;
            }
        });
        */
    });

}


/**
 * This appends an item to the list display as an edtiable item. It is used by showToDoList() to build the
 * main list display with edit buttons
 * @param inItem
 * @param inIndex
 */
function appendEditableItemToListDisplay(inItem, inIndex) {
    var listContentContainer = document.querySelector("#todo-list"),
        listItem = document.createElement("li"),
        listLabel = document.createElement("label"),
        listInput = document.createElement("input"),
        listSpan = document.createElement("span"),
        listFirstParagraph = document.createElement("p"),
        listContent = document.createTextNode(inItem.content),
        listSecondParagraph = document.createElement("p"),
        listTime = document.createElement("time");



    listInput.setAttribute("type", "button");
    listInput.setAttribute("value", "edit");
    listLabel.appendChild(listInput);
    listLabel.appendChild(listSpan);
    listItem.appendChild(listLabel);

    listFirstParagraph.appendChild(listContent);
    listSecondParagraph.appendChild(listTime);
    listItem.appendChild(listFirstParagraph);
    listInput.appendChild(listSecondParagraph);

    listItem.classList.add("todo-item");
    listItem.setAttribute("data-todo-index", inIndex);
    listItem.querySelector("input").checked = inItem.completed;

    listContentContainer.appendChild(listItem);

    listItem.addEventListener("click", function(e) {
        console.log("edit item", inIndex);
        currentItemIndex = inIndex;
        showToDoItemDetails(inIndex);
    });

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
            utils.status.show("New List Created.");
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

/**
 * This function adds a new to do item to the current list. Since our program is a "auto-save" program,
 * we save the list after adding the new item.
 */
function addNewTodoItem() {
    var todoItem = new ToDoItem("Untitled To Do");
    addItemToToDoList(currentList, todoItem);

    saveToDoList(currentList, function(err, succ) {
        if (!err) {
            currentList.id = succ;
            showToDoList(currentList);
            showToDoItemDetails(currentList.items.length - 1);

        }
    });
}

/**
 * This function displays a given item from the current to do list in a detail view that the user can use
 * to edit.
 * @param inItemIndex
 */
function showToDoItemDetails(inItemIndex) {
    var todoItem = currentList.items[inItemIndex];
    currentItemIndex = inItemIndex;

    console.log("todo item", JSON.stringify(todoItem));

    document.querySelector("#todo-item-content").value = todoItem.content;
    document.querySelector('#todo-item-detail').className = 'current';
    document.querySelector('[data-position="current"]').className = 'left';
}

/**
 * This function is called when the user goes from the item detail screen to the list screen, or, whenever
 * something changes in the detail view.
 *
 * It is also responsible for setting the alarm for the to do item.
 *
 * todo: bug in time and date input using the building blocks
 * todo: remake the alarm calls
 */
function saveTodoItemChanges() {
    var itemTitle = document.querySelector("#todo-item-content").value,
        isAlarmSet = false,
        alarmDate = document.querySelector("#todo-item-alarm-date").value,
        alarmTime = document.querySelector("#todo-item-alarm-time").value;

    currentList.items[currentItemIndex].content = itemTitle;

    if (isAlarmSet) {
        currentList.items[currentItemIndex].alarmIsSet = true;
        currentList.items[currentItemIndex].alarm = alarmDate;
        console.log("alarm is set to", alarmDate);
    }


    saveToDoList(currentList, function(err, succ){
        if (!err) {
            console.log("list saved after item changed");
            currentList.id = succ;
        }
    });
}

/**
 * Allows the application to be installed on Firefox OS device (and other devices supporting open web apps).
 */
function appInstall() {
    var manifestUrl = location.protocol + "//" + location.host + "/manifest.webapp";
    var request = window.navigator.mozApps.install(manifestUrl);
    request.onsuccess = function () {
        // Save the App object that is returned
        var appRecord = this.result;
        utils.status.show('Installation successful!');
    };
    request.onerror = function () {
        // Display the error information from the DOMError object
        utils.status.show('Install failed, error: ' + this.error.name);
    };
}

/**
 * This loads all lists and then picks the first one and display it.
 */
function initializeApp() {
    var allToDoLists = [];

    getAllLists(
        function(err, value){
            allToDoLists.push(value);
        },
        function() {
            if (allToDoLists.length > 0) {
                console.log("initializing, loading first list");
                showToDoList(allToDoLists[0]);
            } else {
                // application may still be opening indexeddb.
                console.log("initializing, no list in memory, waiting...");
                setTimeout(initializeApp, 500);
            }
        }
    );

}

function deleteCurrentTodo() {
    var shouldDelete = confirm("Delete the current To Do list?");

    if (shouldDelete) {
        deleteList(currentList.id, function (err, succ) {
            console.log("callback from delete", err, succ);
            if (!err) {
                refreshToDoLists();
                initializeApp();
            }
        });
    }
}


/**
 * Application initialization, basically binding buttons and loading the lists
 */
window.onload = function () {
    console.log("starting the application...");

    // drawer events
    document.querySelector("#create-new-list").addEventListener("click", createNewList);
    document.querySelector("#app-install").addEventListener("click", appInstall);

    // main screen events
    document.querySelector(".list-name").addEventListener("click", renameCurrentList);
    document.querySelector('#add-new-todo-item').addEventListener ('click', addNewTodoItem);
    document.querySelector('#edit-list-mode').addEventListener ('click', function() {
        if (listDisplayMode) {
            listDisplayMode = false;
            showToDoList(currentList);
        } else {
            listDisplayMode = true;
            showToDoList(currentList, "edit");
        }
    });


    // to do item details events
    document.querySelector('#back-to-list').addEventListener ('click', function () {
        console.log("going back to the main view");
        saveTodoItemChanges();
        showToDoList(currentList);
        document.querySelector('#todo-item-detail').className = 'right';
        document.querySelector('[data-position="current"]').className = 'current';
    });

    document.querySelector("#todo-item-content").addEventListener("input", saveTodoItemChanges);

    document.getElementById("delete-current-todo-list").addEventListener("click", deleteCurrentTodo);


    // the entry point for the app is the following command
    refreshToDoLists();
    initializeApp();

};