/**
 * The to do app stores its data using indexedDB.
 *
 * This file holds the indexedDB routines and the routines for
 * working with the to do lists.
 *
 * First we handle the indexedDB setup then we implement the to do
 * handling routines.
 */

const dbName = "todo";
const dbVersion = 1;

var db;
var request = indexedDB.open(dbName, dbVersion);

request.onerror = function (event) {
    console.error("Can't open indexedDB!!!", event);
};
request.onsuccess = function (event) {
    console.log("Database opened ok");
    db = event.target.result;
};

/**
 * After opening the database, we may need to initialize or upgrade our
 * database. This will happen when we run for the first time or if we change
 * the version number used when opening the database.
 *
 * This is where we create our objectStore.
 */

request.onupgradeneeded = function (event) {

    console.log("Running onUpgradeNeeded");

    db = event.target.result;

    if (!db.objectStoreNames.contains("todo")) {

        console.log("Creating objectStore for to do lists");

        var objectStore = db.createObjectStore("todo", {
            keyPath: "id",
            autoIncrement: true
        });
        objectStore.createIndex("title", "title", {
            unique: false
        });

        /*
        Below we add a sample list to the app.

        This way, the app launches with some content
        and not empty.
         */

        console.log("Adding sample to do list");

        var item1 = new ToDoItem("Paint Rainbows"),
            item2 = new ToDoItem("Feed the Unicorns"),
            item3 = new ToDoItem("Be Awesome"),
            sampleList = new ToDoList("Sample To Do List");

        addItemToToDoList(sampleList, item1);
        addItemToToDoList(sampleList, item2);
        addItemToToDoList(sampleList, item3);

        objectStore.add(sampleList);
    }
}

/**
 * This function is used to create new to do items.
 * @constructor
 */

function ToDoItem(inContent) {
    this.content = inContent;
    this.notes = "";
    this.completed = false;
    this.alarmIsSet = false;
    this.alarm = Date.now();
}

/**
 * This function is used to create new to do lists.
 * @constructor
 */
function ToDoList(inTitle) {
    this.title = inTitle;
    this.modified = Date.now();
    this.created = Date.now();
    this.items = [];
}

/**
 * Adds a to do item created with ToDoItem() to a to do list
 * created with ToDoList()
 * @param inToDoList
 * @param inItem
 */
function addItemToToDoList(inToDoList, inItem) {
    inToDoList.items.push(inItem);
}

/**
 * This function will load all to do lists and fire its callback routine for each
 * memo loaded.
 * @param inCallback
 */
function getAllLists(inCallback) {
    var objectStore = db.transaction("todo").objectStore("todo");
    console.log("Listing to do lists...");

    objectStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
            console.log("Found list #" + cursor.value.id + " - " + cursor.value.title);
            inCallback(null, cursor.value);
            cursor.continue();
        }
    };
}

/**
 * This function is used to save a to do list into the indexedDB database. It is called
 * whenever something changes on the list, so it is very aggressive. The idea behind
 * this is that the user never needs to save a to do list for it is always in the saved state.
 * @param inToDoList
 * @param inCallback
 */
function saveToDoList(inToDoList, inCallback) {
    var transaction = db.transaction(["todo"], "readwrite");
    console.log("Saving to do list");

    transaction.oncomplete = function (event) {
        console.log("All done");
    };

    transaction.onerror = function (event) {
        console.error("Error saving to do list:", event);
        inCallback({
            error: event
        }, null);

    };

    var objectStore = transaction.objectStore("todo");

    inToDoList.modified = Date.now();

    var request = objectStore.put(inToDoList);
    request.onsuccess = function (event) {
        console.log("List saved with id: " + request.result);
        inCallback(null, request.result);

    }
}

/**
 * This function is used to remove a to do list from the database. The only way to delete
 * a list in this app is by using the trash button in the editing screen.
 * @param inId
 * @param inCallback
 */
function deleteMemo(inId, inCallback) {
    console.log("Deleting list...");
    var request = db.transaction(["todo"], "readwrite").objectStore("todo").delete(inId);

    request.onsuccess = function (event) {
        console.log("List deleted!");
        inCallback();
    };
}
