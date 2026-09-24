let database;
let request = indexedDB.open("CleaningListDB", 2);

request.onsuccess = function() {
    database = request.result;
};

request.onupgradeneeded = function() {
    database = request.result;

    if (!database.objectStoreNames.contains("photos")) {
        database.createObjectStore("photos", { autoIncrement: true });
    }
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
    displayLists();
}


function openList(listName) {
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


function displayPhoto(photoId) {
    let transaction = database.transaction(["photos"], "readonly");
    let photoStore = transaction.objectStore("photos");
    let getPhoto = photoStore.get(photoId);

    getPhoto.onsuccess = function() {
        let photo = getPhoto.result;

        if (!photo) return;

        let photoUrl = URL.createObjectURL(photo);
        let photoContainer = document.getElementById("photo-" + photoId);

        if (photoContainer) {
            photoContainer.innerHTML =
                "<img src='" + photoUrl + "' width='150'>";
        }
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
        let thumbnail = document.getElementById("thumbnail-" + index);

        if (thumbnail) {
            thumbnail.innerHTML =
                "<img src='" + photoUrl + "'>";
        }
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

        if (!photo) return;

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


/* =========================
   PUNCHLIST STYLE PDF
   ========================= */

async function printList() {
    let printWindow = window.open("", "_blank");

    if (!printWindow) {
        alert("Please allow pop-ups to print this list.");
        return;
    }

    let printContent =
        "<html>" +
        "<head>" +
        "<title>" + currentList.name + "</title>" +

        "<style>" +

            "@page {" +
                "size: A4 portrait;" +
                "margin: 10mm;" +
            "}" +

            "* {" +
                "box-sizing: border-box;" +
            "}" +

            "html, body {" +
                "margin: 0;" +
                "padding: 0;" +
                "width: 100%;" +
            "}" +

            "body {" +
                "font-family: Arial, sans-serif;" +
                "color: black;" +
            "}" +

            ".print-title {" +
                "border: 2px solid black;" +
                "height: 55px;" +
                "display: flex;" +
                "align-items: center;" +
                "justify-content: center;" +
                "font-size: 22px;" +
                "margin-bottom: 5px;" +
            "}" +

            ".print-item {" +
                "display: table;" +
                "table-layout: fixed;" +
                "width: 100%;" +
                "height: 145px;" +
                "margin-bottom: 4px;" +
                "page-break-inside: avoid;" +
                "break-inside: avoid;" +
            "}" +

            ".item-number," +
            ".item-details," +
            ".print-photo {" +
                "display: table-cell;" +
                "height: 145px;" +
                "vertical-align: top;" +
            "}" +

            ".item-number {" +
                "width: 6%;" +
                "border: 2px solid black;" +
                "text-align: center;" +
                "padding: 5px 2px;" +
            "}" +

            ".item-details {" +
                "width: 23.5%;" +
                "border: 2px solid black;" +
                "padding: 5px;" +
                "overflow: hidden;" +
            "}" +

            ".print-photo {" +
                "width: 23.5%;" +
                "height: 145px;" +
                "overflow: hidden;" +
                "padding-left: 4px;" +
            "}" +

            ".print-photo img {" +
                "display: block;" +
                "width: 100%;" +
                "height: 145px;" +
                "object-fit: cover;" +
            "}" +

            ".label {" +
                "font-size: 11px;" +
                "line-height: 1.1;" +
                "color: #444;" +
            "}" +

            ".item-number-value {" +
                "font-size: 14px;" +
                "margin-top: 2px;" +
            "}" +

            ".issue {" +
                "font-size: 14px;" +
                "line-height: 1.15;" +
                "height: 57px;" +
                "overflow: hidden;" +
                "overflow-wrap: anywhere;" +
            "}" +

            ".comment {" +
                "font-size: 13px;" +
                "line-height: 1.15;" +
                "overflow-wrap: anywhere;" +
            "}" +

        "</style>" +
        "</head>" +

        "<body>" +

            "<div class='print-title'>" +
                currentList.name +
            "</div>";


    for (let index = 0; index < currentList.items.length; index++) {

        let item = currentList.items[index];

        printContent +=
            "<div class='print-item'>" +

                "<div class='item-number'>" +
                    "<div class='label'>ITEM</div>" +
                    "<div class='item-number-value'>" +
                        (index + 1) +
                    "</div>" +
                "</div>" +

                "<div class='item-details'>" +

                    "<div class='label'>ISSUE</div>" +
                    "<div class='issue'>" +
                        (item.issue || "") +
                    "</div>" +

                    "<div class='label'>COMMENT</div>" +
                    "<div class='comment'>" +
                        (item.comment || "") +
                    "</div>" +

                "</div>";


        let photoCount = 0;

        if (item.photos) {

            for (let photoId of item.photos) {

                let photoUrl = await getPhotoForPrint(photoId);

                if (photoUrl) {
                    printContent +=
                        "<div class='print-photo'>" +
                            "<img src='" + photoUrl + "'>" +
                        "</div>";

                    photoCount++;
                }
            }
        }


        /* Always create THREE photo columns */

        for (let emptySlot = photoCount; emptySlot < 3; emptySlot++) {
            printContent +=
                "<div class='print-photo'></div>";
        }


        printContent +=
            "</div>";
    }


    printContent +=
        "</body>" +
        "</html>";


    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
}


function getPhotoForPrint(photoId) {
    return new Promise(function(resolve) {

        let transaction = database.transaction(["photos"], "readonly");
        let photoStore = transaction.objectStore("photos");
        let getPhoto = photoStore.get(photoId);

        getPhoto.onsuccess = function() {
            let photo = getPhoto.result;

            if (!photo) {
                resolve(null);
                return;
            }

            let reader = new FileReader();

            reader.onload = function() {
                resolve(reader.result);
            };

            reader.readAsDataURL(photo);
        };

        getPhoto.onerror = function() {
            resolve(null);
        };
    });
}


/* =========================
   DELETE / EDIT
   ========================= */

function deleteList(index) {
    let confirmDelete = confirm("Delete this list?");

    if (!confirmDelete) {
        return;
    }

    lists.splice(index, 1);

    localStorage.setItem("lists", JSON.stringify(lists));
    displayLists();
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
    displayLists();
}


function displayLists() {
    document.getElementById("listContainer").innerHTML = "";

    lists.forEach(function(list, index) {

        document.getElementById("listContainer").innerHTML +=
            "<div class='list-card'>" +
                "<button class='list-name' onclick='openList(\"" + list.name + "\")'>" +
                    list.name +
                "</button>" +

                "<div class='list-actions'>" +
                    "<button class='edit-list' onclick='editList(" + index + ")'>Edit</button>" +
                    "<button class='delete-list' onclick='deleteList(" + index + ")'>Delete</button>" +
                "</div>" +
            "</div>";
    });
}


/* =========================
   LOAD SAVED LISTS
   ========================= */

let savedLists = localStorage.getItem("lists");

if (savedLists) {
    lists = JSON.parse(savedLists);
}

displayLists();