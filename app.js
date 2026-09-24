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
    let listName = prompt("List name: ");

    if (!listName) return;

    lists.push({
        name: listName,
        items: []
    });

    localStorage.setItem("lists", JSON.stringify(lists));

    document.getElementById("listContainer").innerHTML +=
        "<div class='list-card'>" +
            "<button class='list-name' onclick='openList(\"" + listName + "\")'>" + listName + "</button>" +
            "<div class='list-actions'>" +
                "<button class='edit-list' onclick='editList(" + (lists.length - 1) + ")'>Edit</button>" +
                "<button class='delete-list' onclick='deleteList(" + (lists.length - 1) + ")'>Delete</button>" +
            "</div>" +
        "</div>";
}
function openList(listName){
    currentList = lists.find(function(list) {
        return list.name === listName;
    });

    document.getElementById("homeScreen").style.display = "none";

    document.getElementById("openListContainer").innerHTML =
        "<div id='listHeader'>" +
            "<button onclick='goBack()'>← Back</button>" +
            "<h2>" + listName + "</h2>" +
            "<button onclick='addItem()'>+ Add Item</button>" +
            "<button onclick='printList()'>Print / PDF</button>" +
        "</div>" +
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
    document.getElementById("listHeader").style.display = "block";
    document.getElementById("itemContainer").innerHTML = "";

    currentList.items.forEach(function(item, index) {

        document.getElementById("itemContainer").innerHTML +=
            "<div class='job-row' onclick='openItem(" + index + ")'>" +
                "<div class='job-thumbnail' id='thumbnail-" + index + "'></div>" +
                "<div class='job-info'>" +
                    "<div class='job-issue'>" + (item.issue || "") + "</div>" +
                    (item.comment
                        ? "<div class='job-comment'>" + item.comment + "</div>"
                        : "") +
                "</div>" +
            "</div>";

        if (item.photos && item.photos.length > 0) {
            displayThumbnail(item.photos[0], index);
        }
    });
}
function openItem(index) {
    let item = currentList.items[index];
    document.getElementById("listHeader").style.display = "none";
    document.getElementById("itemContainer").innerHTML =
        "<button class='item-back' onclick='displayItems()'>← Back to list</button>" +
        "<div class='expanded-item' id='item-" + index + "'>" +
            "<h3>" + (item.issue || "") + "</h3>" +
            "<div class='expanded-photos' id='photo-row-" + index + "'></div>" +
        "</div>";

    if (item.photos) {
        item.photos.forEach(function(photoId, photoIndex) {
            document.getElementById("photo-row-" + index).innerHTML +=
                "<div class='expanded-photo'>" +
                    "<div id='photo-" + photoId + "'></div>" +
                    "<button onclick='deletePhoto(" + index + ", " + photoIndex + ")'>Delete photo</button>" +
                "</div>";

            displayPhoto(photoId);
        });
    }

    if (!item.photos || item.photos.length < 3) {
        document.getElementById("photo-row-" + index).innerHTML +=
            "<button class='add-photo-tile' onclick='addPhoto(" + index + ")'>+</button>";
    }

    if (item.comment) {
        document.getElementById("item-" + index).innerHTML +=
            "<p class='expanded-comment-label'>COMMENT</p>" +
            "<p class='expanded-comment'>" + item.comment + "</p>";
    }

    document.getElementById("item-" + index).innerHTML +=
        "<div class='item-actions'>" +
            "<button class='item-edit' onclick='editItem(" + index + ")'>Edit item</button>" +
            "<button class='item-delete' onclick='deleteItem(" + index + ")'>Delete item</button>" +
        "</div>";
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
function displayThumbnail(photoId, index) {
    let transaction = database.transaction(["photos"], "readonly");
    let photoStore = transaction.objectStore("photos");
    let getPhoto = photoStore.get(photoId);

    getPhoto.onsuccess = function() {
        let photo = getPhoto.result;

        if (!photo) return;

        let photoUrl = URL.createObjectURL(photo);

        document.getElementById("thumbnail-" + index).innerHTML =
            "<img src='" + photoUrl + "'>";
    };
}
function deletePhoto(itemIndex, photoIndex) {
    let confirmDelete = confirm("Delete this photo?");

    if (!confirmDelete) {
        return;
    }

    currentList.items[itemIndex].photos.splice(photoIndex, 1);

    localStorage.setItem("lists", JSON.stringify(lists));
    openItem(itemIndex);
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
            openItem(index);
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
    openItem(index);
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
        "<div class='list-card'>" +
            "<button class='list-name' onclick='openList(\"" + list.name + "\")'>" + list.name + "</button>" +
            "<div class='list-actions'>" +
                "<button class='edit-list' onclick='editList(" + index + ")'>Edit</button>" +
                "<button class='delete-list' onclick='deleteList(" + index + ")'>Delete</button>" +
            "</div>" +
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
