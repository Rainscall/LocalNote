const decryptKey = atob("SnFhM0VnZHNzVmxnTUhZS3RuOGM=");

// 创建一个观察器实例并传入回调函数
var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        if (mutation.type == 'characterData' || mutation.type == 'childList') {
            saveToLS();
        }
    });
});

// 配置观察选项:
var config = { attributes: true, childList: true, characterData: true, subtree: true };

// 传入目标节点和观察选项
observer.observe(noteArea, config);

// 初始化定时器变量
var toastTimeout;


noteArea.addEventListener('paste', function (e) {
    e.preventDefault(); // 阻止默认行为，即阻止将粘贴的内容插入到div中
    var text = e.clipboardData.getData('text/plain'); // 获取粘贴的纯文本内容
    document.execCommand('insertText', false, text); // 将纯文本内容插入到div中
});

document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "s") {
        e.preventDefault(); // 阻止浏览器默认保存行为
        Toastify({
            text: "note already saved.",
            duration: 1200,
            className: "info",
            position: "center",
            gravity: "bottom",
            style: {
                background: "#414141",
            }
        }).showToast();
    }
});

function startUp() {
    backgroundImageData = localStorage.getItem('background.image');
    if (backgroundImageData) {
        document.body.style.backgroundImage = 'url(\'' + backgroundImageData + '\')';
    }

    var localNote = readFromLS();
    if (localNote) {
        noteArea.innerText = localNote;
        Toastify({
            text: "Note loaded.",
            duration: 1200,
            className: "info",
            position: "center",
            gravity: "bottom",
            style: {
                background: "#414141",
            }
        }).showToast();
        return;
    } else {
        noteArea.innerText = '';
        Toastify({
            text: "New note created.",
            duration: 1200,
            className: "info",
            position: "center",
            gravity: "bottom",
            style: {
                background: "#414141",
            }
        }).showToast();
        return;
    }
}

function encryptAES256(plaintext, key) {
    const ciphertext = CryptoJS.AES.encrypt(plaintext, key).toString();
    return ciphertext;
}
function decryptAES256(ciphertext, key) {
    const plaintext = CryptoJS.AES.decrypt(ciphertext, key).toString(CryptoJS.enc.Utf8);
    return plaintext;
}

var resetKeyCilckTimes = 0;
function resetKey() {
    const resetKeyText = document.getElementById('resetKeyText');
    if (resetKeyCilckTimes == 0) {
        resetKeyCilckTimes += 1;
        resetKeyText.innerHTML = '<span style="color:#fff;";>confirm</span>';
        // Set a timeout to reset the click times after few seconds
        setTimeout(function () {
            resetKeyCilckTimes = 0;
            resetKeyText.innerText = 'reset';
        }, 1700);
        return;
    }

    noteNameInput.value = '';
    titleBar.innerText = 'LocalNote';
    localStorage.clear();
    Toastify({
        text: "note cleared.",
        duration: 1200,
        className: "info",
        position: "center",
        gravity: "bottom",
        style: {
            background: "#414141",
        }
    }).showToast();
    noteArea.innerText = "";
    resetKeyCilckTimes = 0;
    resetKeyText.innerText = 'reset';
    openMenuPage();
}

const noteNameInput = document.getElementById('noteNameInput');
function saveToLS() {
    let noteKey = 'note.' + titleBar.innerText;
    if (noteKey == 'note.') {//判断是否为空
        noteKey = "note.LocalNote";
    }
    const noteArea = document.getElementById('noteArea');
    localStorage.setItem(noteKey, encryptAES256(noteArea.innerText, decryptKey));
}

function readFromLS() {
    let noteKey = 'note.' + titleBar.innerText;
    console.log(noteKey);
    if (noteKey == 'note.') { //判断是否为空
        noteKey = "note.LocalNote";
    }
    if (!localStorage.getItem(noteKey)) {
        return;
    }
    return decryptAES256(localStorage.getItem(noteKey), decryptKey);
}

function removeFromLS(noteKey) {
    localStorage.removeItem(noteKey);
    Toastify({
        text: "note removed.",
        duration: 1200,
        className: "info",
        position: "center",
        gravity: "bottom",
        style: {
            background: "#414141",
        }
    }).showToast();

    openMenuPage();
}

function triggerButtonById(buttonId) {
    const button = document.getElementById(buttonId);

    if (button) {
        button.click();
    } else {
        console.log(`Button with id '${buttonId}' not found.`);
    }
}

function copyToClipboard(elementId) {
    var element = document.getElementById(elementId);
    element.select();
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
}

// 定义一个函数，接受一个参数id
function copyInnerText(id) {
    // 获取id对应的元素
    var element = document.getElementById(id);
    // 判断元素是否存在
    if (element) {
        var innerText = element.innerText;
        var textarea = document.createElement("textarea");
        textarea.value = innerText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        // 返回成功信息
        Toastify({
            text: "Copied.",
            duration: 1200,
            className: "info",
            position: "center",
            gravity: "bottom",
            style: {
                background: "#414141",
            }
        }).showToast();
        return 0;
    } else {
        // 返回失败信息
        return 1;
    }
}

function openMenuPage() {
    const listBasePart = document.getElementById("listBasePart");
    const listTable = document.getElementById("listTable");

    var itemCounter = 0;

    listTable.innerHTML = "";
    listBasePart.style.display = "flex";

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("note.")) {
            let itemDivFather = document.createElement("div");
            let itemDiv = document.createElement("div");
            let delButtom = document.createElement("div");

            delButtom.className = "delButtom";
            delButtom.innerText = "";

            itemDiv.setAttribute("onclick", "openNote(\"" + key + "\")");
            itemDiv.innerText = key.slice(5);
            delButtom.setAttribute("onclick", "removeFromLS(\"" + key + "\")");


            itemDivFather.className = "itemDivFather";
            itemDivFather.appendChild(itemDiv);
            itemDivFather.appendChild(delButtom);

            listTable.appendChild(itemDivFather);

            itemCounter = itemCounter + 1
        }

    }
    if (itemCounter == 0) {
        let itemDiv = document.createElement("div");
        itemDiv.style.textAlign = "center";
        itemDiv.innerText = "[List is empty.]";
        listTable.appendChild(itemDiv);
    }
}

function openNote(noteKey) {
    const titleBar = document.getElementById('titleBar');

    closeOverlay('listBasePart');

    titleBar.innerText = noteKey.slice(5);
    var localNote = decryptAES256(localStorage.getItem(noteKey), decryptKey);
    if (localNote) {
        noteArea.innerText = localNote;
        titleBar.innerText = noteKey.slice(5);
        Toastify({
            text: "Note loaded.",
            duration: 1200,
            className: "info",
            position: "center",
            gravity: "bottom",
            style: {
                background: "#414141",
            }
        }).showToast();
        return;
    } else {
        noteArea.innerText = '';
        titleBar.innerText = 'LocalNote'
        Toastify({
            text: "Note loaded.",
            duration: 1200,
            className: "info",
            position: "center",
            gravity: "bottom",
            style: {
                background: "#414141",
            }
        }).showToast();
    }
}

function closeOverlay(elementID) {
    document.getElementById(elementID).style.display = "none";
}

function changeTitleBar() {
    titleBar.innerText = noteNameInput.value;
    noteNameInput.value = '';
}

function selectBackground() {
    const bgFileInput = document.getElementById('bgFileInput');
    bgFileInput.click();
}

function setBackground() {
    const file = bgFileInput.files[0];
    const reader = new FileReader();

    localStorage.removeItem('background.image');

    reader.readAsDataURL(file);
    reader.onload = function () {
        const backgroundImage = reader.result;
        document.body.style.backgroundImage = 'url(\'' + backgroundImage + '\')';
        localStorage.setItem('background.image', backgroundImage);
        closeOverlay('listBasePart');
    };
}

function resetBackground() {
    localStorage.removeItem('background.image');
    document.body.style.backgroundImage = '';
    closeOverlay('listBasePart');
    Toastify({
        text: "Background reset.",
        duration: 1200,
        className: "info",
        position: "center",
        gravity: "bottom",
        style: {
            background: "#414141",
        }
    }).showToast();
}