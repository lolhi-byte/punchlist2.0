let database;
let request = indexedDB.open("CleaningListDB", 2);
request.onsuccess = function() {
    database = request.result;
};
request.onupgradeneeded = function() {
database = request.result;
database.createObjectStore("photos", { autoIncrement: true });
};
let lists = [];
let currentList = null;
   function newList() {
    let listName = prompt("List name?: ");

    lists.push({
        name: listName,
        items: []
    });
    localStorage.setItem("lists", JSON.stringify(lists));
    document.getElementById("listContainer").innerHTML +=
        "<p>" + listName + "</p>";
}
function openList(listName){
    currentList = lists.find(function(list) {
        return list.name === listName;
    });
    document.getElementById("homeScreen").style.display = "none";
    document.getElementById("openListContainer").innerHTML =
    "<button onclick='goBack()'>← Back</button>" +
    "<h2>" + listName + "</h2>" +
    "<button onclick='addItem()'>+ Add Item</button>" +
    "<button onclick='printList()'>Print / PDF</button>" +
    "<div id='itemContainer'></div>";
    displayItems();
}
function goBack() {
    document.getElementById("homeScreen").style.display = "block";
    document.getElementById("openListContainer").innerHTML = "";
}
function addItem() {
    let issue = prompt("Issue: ");
    if (!issue) {
        return;
    }
    let comment = prompt("Comment (optional): ");

    currentList.items.push({
        issue: issue,
        comment: comment,
        photos: []
    });
    localStorage.setItem("lists", JSON.stringify(lists));
    displayItems();
}
function displayItems() {
    document.getElementById("itemContainer").innerHTML = "";

    currentList.items.forEach(function(item, index) {
        document.getElementById("itemContainer").innerHTML +=
            "<div class='report-item' id='item-" + index + "'>" +
            "<p class='report-label'>ISSUE</p>" +
            "<p class='report-issue'>" + item.issue + "</p>";

        if (item.comment) {
            document.getElementById("item-" + index).innerHTML +=
                "<p class='report-label'>COMMENT</p>" +
                "<p class='report-comment'>" + item.comment + "</p>";
        }

        if (item.photos) {
            document.getElementById("item-" + index).innerHTML +=
                "<div class='photo-row' id='photo-row-" + index + "'></div>";

            item.photos.forEach(function(photoId, photoIndex) {
                document.getElementById("photo-row-" + index).innerHTML +=
                    "<div class='photo-wrapper'>" +
                    "<div id='photo-" + photoId + "'></div>" +
                    "<button onclick='deletePhoto(" + index + ", " + photoIndex + ")'>Delete photo</button>" +
                    "</div>";

                displayPhoto(photoId);
            });
        }

        document.getElementById("item-" + index).innerHTML +=
            "<button onclick='addPhoto(" + index + ")'>📷 Add Photo/s</button>" +
            "<button onclick='editItem(" + index + ")'>Edit item</button>" +
            "<button onclick='deleteItem(" + index + ")'>Delete item</button>" +
            "</div>";
    });
}
function displayPhoto(photoId){
    let transaction = database.transaction(["photos"], "readonly");
    let photoStore = transaction.objectStore("photos");
    let getPhoto = photoStore.get(photoId);
    getPhoto.onsuccess = function() {
        let photo = getPhoto.result;
        let photoUrl = URL.createObjectURL(photo);
        document.getElementById("photo-" + photoId).innerHTML =
        "<img src='" + photoUrl + "' width='150'>";
    };
}
function deletePhoto(itemIndex, photoIndex) {
    currentList.items[itemIndex].photos.splice(photoIndex, 1);

    localStorage.setItem("lists", JSON.stringify(lists));
    displayItems();
}
function addPhoto(index) {
    if (!currentList.items[index].photos) {
    currentList.items[index].photos = [];
}
    if (currentList.items[index].photos.length >= 3) {
        alert("Max 3 photos");
        return;
    }
    let photoInput = document.createElement("input");

    photoInput.type = "file";
    photoInput.accept = "image/*";
    photoInput.onchange = function() {
        let photo = photoInput.files[0];
        let transaction = database.transaction(["photos"], "readwrite");
        let photoStore = transaction.objectStore("photos");
        let savePhoto = photoStore.add(photo);
        savePhoto.onsuccess = function() {
            let photoId = savePhoto.result;
            currentList.items[index].photos.push(photoId);
            localStorage.setItem("lists", JSON.stringify(lists));
            displayItems();
        };
    };
    photoInput.click();
}
function printList() {
    window.print();
}
function deleteList(index) {
    let confirmDelete = confirm("Delete this list?");

    if (!confirmDelete) {
        return;
    }

    lists.splice(index, 1);

    localStorage.setItem("lists", JSON.stringify(lists));

    document.getElementById("listContainer").innerHTML = "";

    lists.forEach(function(list, index) {
        displayLists();
    });
}
function deleteItem(index) {
    let confirmDelete = confirm("Delete this item?");

    if (!confirmDelete) {
        return;
    }

    currentList.items.splice(index, 1);

    localStorage.setItem("lists", JSON.stringify(lists));
    displayItems();
}
function editItem(index) {
    let currentIssue = currentList.items[index].issue;
    let currentComment = currentList.items[index].comment;

    let newIssue = prompt("Issue:", currentIssue);

    if (!newIssue) {
        return;
    }

    let newComment = prompt("Comment:", currentComment);

    currentList.items[index].issue = newIssue;
    currentList.items[index].comment = newComment;

    localStorage.setItem("lists", JSON.stringify(lists));
    displayItems();
}
function editList(index) {
    let currentName = lists[index].name;

    let newName = prompt("List name:", currentName);

    if (!newName) {
        return;
    }

    lists[index].name = newName;

    localStorage.setItem("lists", JSON.stringify(lists));

    document.getElementById("listContainer").innerHTML = "";

    lists.forEach(function(list, index) {
        displayLists();
    });
}
function displayLists() {
    document.getElementById("listContainer").innerHTML = "";

    lists.forEach(function(list, index) {
        document.getElementById("listContainer").innerHTML +=
            "<div>" +
            "<button onclick='openList(\"" + list.name + "\")'>" + list.name + "</button>" +
            "<button onclick='editList(" + index + ")'>Edit list</button>" +
            "<button onclick='deleteList(" + index + ")'>Delete list</button>" +
            "</div>";
    });
}
let savedLists = localStorage.getItem("lists");

if (savedLists) {
lists = JSON.parse(savedLists);

lists.forEach(function(list, index) {
    displayLists();
});
}
