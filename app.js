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
        listFirstParagraph = document.createElement("p"),
        listContent = document.createTextNode(inItem.content),
        itemEditButton = document.createElement("button");


    listFirstParagraph.appendChild(listContent);
    listFirstParagraph.classList.add("position-left");

    itemEditButton.classList.add("edit-button");
    itemEditButton.innerHTML = "EDIT"


    if (inItem.completed) {
        listFirstParagraph.classList.add("task-done");
        listFirstParagraph.classList.remove("task-open");
    } else {
        listFirstParagraph.classList.remove("task-done");
        listFirstParagraph.classList.add("task-open");
    }

    listItem.appendChild(listFirstParagraph);
    listItem.appendChild(itemEditButton);
    listContentContainer.appendChild(listItem);

    listFirstParagraph.addEventListener("click", function(e) {
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
    });

    itemEditButton.addEventListener("click", function() {
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
 * Display the todo item details on the interface
 * @param inTodoItem
 */
function refreshItemDetails(inTodoItem) {
    var itemContent = document.querySelector("#todo-item-content"),
        alarmIsSet = document.querySelector("#alarm-set"),
        itemNotes = document.querySelector("#todo-item-notes"),
        alarmDateTime = document.querySelector("#todo-alarm-datetime");

    itemContent.value = inTodoItem.content;
    itemNotes.value = inTodoItem.notes;

    if (inTodoItem.alarmIsSet) {
        alarmIsSet.checked = true;
    } else {
        alarmIsSet.checked = false;
    }

    if (inTodoItem.alarm !== null) {
        alarmDateTime.value = inTodoItem.alarm;
    } else {
        alarmDateTime.value = "Tap to set date and time"
    }
}


/**
 * This function displays a given item from the current to do list in a detail view that the user can use
 * to edit.
 * @param inItemIndex
 */
function showToDoItemDetails(inItemIndex) {
    var todoItem = currentList.items[inItemIndex],
        alarmIsSet = document.getElementById("alarm-set"),
        alarmControls = document.getElementById("alarm-controls");

    currentItemIndex = inItemIndex;

    console.log("todo item", JSON.stringify(todoItem));
    refreshItemDetails(todoItem);
    document.querySelector('#todo-item-detail').className = 'current';
    document.querySelector('[data-position="current"]').className = 'left';

    if (alarmIsSet.checked) {
        alarmControls.classList.remove("hidden");
    } else {
        alarmControls.classList.add("hidden");
    }

    alarmIsSet.addEventListener("click", function() {
        // reveal date time buttons
        if (alarmIsSet.checked) {
            alarmControls.classList.remove("hidden");
        } else {
            alarmControls.classList.add("hidden");
        }
    });
}

/**
 * This function is called when the user goes from the item detail screen to the list screen, or, whenever
 * something changes in the detail view.
 *
 * It is also responsible for setting the alarm for the to do item.
 *
 * todo: remake the alarm calls
 */
function saveTodoItemChanges() {
    var itemTitle = document.querySelector("#todo-item-content").value,
        itemNotes = document.querySelector("#todo-item-notes").value,
        isAlarmSet = document.querySelector("#alarm-set").checked,
        alarmDate = document.querySelector("#todo-alarm-datetime").value,
        currentTodoItem = currentList.items[currentItemIndex];

    currentTodoItem.content = itemTitle;
    currentTodoItem.notes = itemNotes;


    if (isAlarmSet) {
        currentTodoItem.alarmIsSet = true;
        currentTodoItem.alarm = alarmDate;
        console.log("alarm is set to", alarmDate);
    } else {
        currentTodoItem.alarmIsSet = false;
        currentTodoItem.alarm = null;
        console.log("alarm cleared");
    }

    maintainAlarms(currentTodoItem, function (err, succ) {

        if (err) {
            utils.status.show("Could not schedule alarm!");
        }

        logAlarmData();

        saveToDoList(currentList, function(err, succ){
            if (!err) {
                console.log("list saved after item changed");
                currentList.id = succ;
            }
        });
    });
}

/**
 * Used to display scheduled alarms in the console for debugging purposes
 */
function logAlarmData() {
    var request = navigator.mozAlarms.getAll();

    console.log("Dumping all alarm data...");

    request.onsuccess = function () {
        this.result.forEach(function (alarm) {
            console.log('Id: ' + alarm.id);
            console.log('date: ' + alarm.date);
            console.log('respectTimezone: ' + alarm.respectTimezone);
            console.log('data: ' + JSON.stringify(alarm.data));
        });
    };

    request.onerror = function () {
        console.log("An error occurred: " + this.error.name);
    };
}

/**
 * Schedule alarms using AlarmAPI (https://developer.mozilla.org/en-US/docs/WebAPI/Alarm)
 * @param inTodoItem
 * @param inCallback
 */
function maintainAlarms(inTodoItem, inCallback) {

    // Check is alarm was set and is now cleared, should cancel old alarm
    if (inTodoItem.alarmIsSet === false && inTodoItem.alarmID !== 0) {
        console.log("Removing alarm...");
        if (inTodoItem.alarmID) {
            navigator.mozAlarms.remove(inTodoItem.alarmID);
        }
    }

    // Check if alarm is now set and alarm id is not 0 then
    // clear old alarm and set it again
    if (inTodoItem.alarmIsSet === true) {
        console.log("Setting alarm");
        if (inTodoItem.alarmID !== 0) {
            // clear old alarm
            navigator.mozAlarms.remove(inTodoItem.alarmID);
        }

        // Set new alarm
        console.log("Setting alarm to: "+inTodoItem.alarm);
        var date = new Date(inTodoItem.alarm);

        var request = navigator.mozAlarms.add(date, "honorTimezone", inTodoItem);

        request.onsuccess = function() {
            console.log("Scheduled alarm, id:" + this.result.id);
            inTodoItem.alarmID = this.result.id;
            inCallback(null, inTodoItem);
        };

        request.onerror = function() {
            console.log("Error: Could not schedule alarm.")
            inTodoItem.alarmID = 0;
            inTodoItem.alarmIsSet = false;
            inCallback(true, null);
        };
    }
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
    document.getElementById("delete-current-todo-list").addEventListener("click", deleteCurrentTodo);



    // to do item details events
    document.querySelector('#back-to-list').addEventListener ('click', function () {
        console.log("going back to the main view");
        saveTodoItemChanges();
        showToDoList(currentList);
        document.querySelector('#todo-item-detail').className = 'right';
        document.querySelector('[data-position="current"]').className = 'current';
    });

    document.querySelector("#todo-item-content").addEventListener("input", saveTodoItemChanges);


    // the entry point for the app is the following command
    refreshToDoLists();
    initializeApp();
    logAlarmData();

};


// Deal with alarms
navigator.mozSetMessageHandler("alarm", function (mozAlarm) {
    console.log("Triggering alarm", JSON.stringify(mozAlarm));
    alert("Remember: " + mozAlarm.data.content);
});