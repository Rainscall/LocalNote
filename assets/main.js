var isFirstChange = 0;
// 创建一个观察器实例并传入回调函数
var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        if (mutation.type == 'characterData' || mutation.type == 'childList') {
            if (isFirstChange != 0) {//判断是否是第一次修改以识别是刚刚读取还是读取后修改
                saveToLS();
            } else {
                isFirstChange += 1;
                return;
            }
        }
    });
});

// 配置观察选项:
var config = { attributes: true, childList: true, characterData: true, subtree: true };

// 传入目标节点和观察选项
observer.observe(noteArea, config);

// 初始化定时器变量
var toastTimeout;

//监听页面失焦后重新聚焦，并重新读取localstorage
document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
        startUp(1);
    }
})

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

function createNewNote() {
    let noteKey = 'note.' + noteNameInput.value;
    if (localStorage.getItem(noteKey)) {
        openNote(noteKey);
        return;
    }
    changeTitleBar();
    diskSpace.innerText = (getLocalStorageUsage() / 1024 / 1024).toFixed(4) + '/' + (getBrowserStorageLimit());
    noteArea.innerText = '';
    closeOverlay('listBasePart');
}

var passwordInputAction = 'login';
function auth() {
    let decryptKeyHash = localStorage.getItem('decryptKeyHash');
    const getPassword = document.getElementById('getPassword');
    const pwdTitle = document.getElementById('pwdTitle');
    if (!decryptKeyHash) {
        passwordInputAction = 'signUp';
        pwdTitle.innerHTML = 'Sign Up';
    } else {
        pwdTitle.innerHTML = 'Login';
        passwordInputAction = 'login';
    }
    getPassword.style.display = 'flex';

    scrollControl('deny');
}

var decryptKey = 0;
function passwordInput() {
    let decryptKeyHash = localStorage.getItem('decryptKeyHash');
    const passwordInput = document.getElementById('passwordInput');
    if (!passwordInput.value) {
        Toastify({
            text: "Input something please?",
            duration: 1500,
            className: "info",
            position: "center",
            gravity: "bottom",
            style: {
                background: "#414141",
            }
        }).showToast();
        return;
    }

    let tempDecryptKeyHash = getSHA3(passwordInput.value);
    if (passwordInputAction == 'signUp') {
        localStorage.setItem('decryptKeyHash', tempDecryptKeyHash);
        Toastify({
            text: "Password set.",
            duration: 3500,
            className: "info",
            position: "center",
            gravity: "bottom",
            style: {
                background: "#414141",
            }
        }).showToast();
        startUp();
    } else {
        if (tempDecryptKeyHash != decryptKeyHash) {
            Toastify({
                text: "Wrong password.",
                duration: 3500,
                className: "info",
                position: "center",
                gravity: "top",
                style: {
                    background: "#840D23",
                }
            }).showToast();
            return;
        }
    }
    decryptKey = passwordInput.value;
    startUp();
    passwordInput.value = '';
    closeOverlay('getPassword');
}

function startUp(isQuiet) {
    if (!isQuiet) {
        isQuiet = 0;
    }
    const diskSpace = document.getElementById('diskSpace');

    backgroundImageData = localStorage.getItem('background.image');
    if (backgroundImageData) {
        selectBackgroundText.innerText = localStorage.getItem('background.fileName');
        document.body.style.backgroundImage = 'url(\'' + backgroundImageData + '\')';
        selectBackgroundText.parentNode.parentNode.style.backgroundImage = 'url(\'' + backgroundImageData + '\')';
    }

    diskSpace.innerText = (getLocalStorageUsage() / 1024 / 1024).toFixed(4) + '/' + (getBrowserStorageLimit());

    lastTime = localStorage.getItem('lastTime');
    if (lastTime) {
        if (decryptAES256(localStorage.getItem(lastTime), decryptKey)) {
            openNote(lastTime, 1);
            return;
        } else if (!decryptAES256(localStorage.getItem(lastTime), decryptKey)) {
            removeFromLS(lastTime);
            localStorage.removeItem('lastTime');
        }
    }

    var localNote = readFromLS();
    if (localNote) {
        noteArea.innerText = localNote;
        if (isQuiet == 0) {
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
        return;
    } else {
        noteArea.innerText = '';
        if (isQuiet == 0) {
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
}

function getSHA3(massage) {
    const result = CryptoJS.SHA3(massage).toString();
    return result;
}

function encryptAES256(plaintext, key) {
    const ciphertext = CryptoJS.AES.encrypt(plaintext, key).toString();
    return ciphertext;
}
function decryptAES256(ciphertext, key) {
    const plaintext = CryptoJS.AES.decrypt(ciphertext, key).toString(CryptoJS.enc.Utf8);
    return plaintext;
}

function openResetKeyMenu() {
    const warnInfo = document.getElementById('warnInfo');
    warnInfo.style.display = "flex";
    scrollControl('deny');
}

function resetKey() {
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
    document.body.style.backgroundImage = 'none';
    selectBackgroundText.parentNode.parentNode.style.backgroundImage = 'none';
    selectBackgroundText.innerText = 'select background';
    closeOverlay('warnInfo');
    openMenuPage();
    location.reload();
}

const noteNameInput = document.getElementById('noteNameInput');
function saveToLS() {
    let noteKey = 'note.' + titleBar.innerText;
    if (noteKey == 'note.') {//判断是否为空
        noteKey = "note.LocalNote";
    }
    localStorage.setItem('lastTime', noteKey);
    const noteArea = document.getElementById('noteArea');
    localStorage.setItem(noteKey, encryptAES256(noteArea.innerText, decryptKey));
    let currentTimeStamp = Date.parse(new Date()).toString(10);
    localStorage.setItem('timeStamp.' + noteKey, encryptAES256(currentTimeStamp, decryptKey));
}

function readFromLS() {
    let noteKey = 'note.' + titleBar.innerText;
    if (noteKey == 'note.') { //判断是否为空
        noteKey = "note.LocalNote";
    }
    if (!localStorage.getItem(noteKey)) {
        return;
    }
    return decryptAES256(localStorage.getItem(noteKey), decryptKey);
}

function readTimeStampFromLS(tsKey) {
    if (!tsKey) {
        return;
    }
    return decryptAES256(localStorage.getItem(tsKey), decryptKey);
}

function removeFromLS(noteKey) {
    localStorage.removeItem(noteKey);
    localStorage.removeItem('timeStamp.' + noteKey);
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

    //判断被删除的项是否是当前打开的项目，如果是则切换回LocalNote默认项
    if ('note.' + titleBar.innerText == noteKey) {
        titleBar.innerText = 'LocalNote';
        localStorage.removeItem('lastTime');
        readFromLS(); startUp();
    }
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
    const basePart = document.getElementById('basePart');

    var itemCounter = 0;
    listTable.innerHTML = "";
    listBasePart.style.display = "flex";
    basePart.style.maxHeight = '100svh';//强制将basePart的最大高度设置为100svh

    diskSpace.innerText = (getLocalStorageUsage() / 1024 / 1024).toFixed(4) + '/' + (getBrowserStorageLimit());

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("note.")) {
            let itemDivFather = document.createElement("div");
            let itemDiv = document.createElement("div");
            let delButtom = document.createElement("div");
            let timeStampSpan = '';

            if (key.startsWith("note.")) {
                delButtom.className = "delButtom";
                delButtom.innerText = "";

                itemDiv.setAttribute("onclick", "openNote(\"" + key + "\")");

                //读取上次打开时间并设置
                if (localStorage.getItem('timeStamp.' + key)) {
                    timeStampSpan = timeStampToDate(readTimeStampFromLS('timeStamp.' + key));
                } else {
                    timeStampSpan = '[unknown]';
                }
                itemDiv.innerHTML = key.slice(5) + '<span class=\'timeStampSpan\'>' + timeStampSpan + '</span>'
                delButtom.setAttribute("onclick", "removeFromLS(\"" + key + "\")");

                itemDivFather.className = "itemDivFather";
                itemDivFather.appendChild(itemDiv);
                itemDivFather.appendChild(delButtom);
                listTable.appendChild(itemDivFather);
                itemCounter = itemCounter + 1
            }
        }

    }
    if (itemCounter == 0) {
        let itemDiv = document.createElement("div");
        itemDiv.style.textAlign = "center";
        itemDiv.innerText = "[List is empty.]";
        listTable.appendChild(itemDiv);
    }
}

function openNote(noteKey, isQuiet) {
    if (!isQuiet) {
        isQuiet = 0;
    }
    const titleBar = document.getElementById('titleBar');
    isFirstChange = 0;

    closeOverlay('listBasePart');

    titleBar.innerText = noteKey.slice(5);
    var localNote = decryptAES256(localStorage.getItem(noteKey), decryptKey);
    if (localNote) {
        noteArea.innerText = localNote;
        titleBar.innerText = noteKey.slice(5);
        localStorage.setItem('lastTime', noteKey);
        if (isQuiet == 0) {
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
        return;
    } else {
        noteArea.innerText = '';
        titleBar.innerText = 'LocalNote'
        // localStorage.setItem('lastTime', 'note.LocalNote');
        if (isQuiet == 0) {
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
}

function closeOverlay(elementID) {
    scrollControl('allow');
    document.getElementById(elementID).style.display = "none";
    basePart.setAttribute('style', '')
}

function changeTitleBar() {
    titleBar.innerText = noteNameInput.value;
    basePart.style.maxHeight = 'auto';//将basePart的内联样式清除
}

function selectBackground() {
    const bgFileInput = document.getElementById('bgFileInput');
    bgFileInput.click();
}

function setBackground() {
    const file = bgFileInput.files[0];
    const reader = new FileReader();
    const selectBackgroundText = document.getElementById('selectBackgroundText');

    if (file.size > 1024 * 1024 * 1.5) {
        Toastify({
            text: "Image is too big.\nMax:1.5m",
            duration: 2000,
            className: "info",
            position: "center",
            gravity: "bottom",
            style: {
                background: "#414141",
                textAlign: "center",
            }
        }).showToast();
        bgFileInput.value = '';
        return;
    }
    localStorage.removeItem('background.image');
    selectBackgroundText.innerText = file.name;
    reader.readAsDataURL(file);
    reader.onload = function () {
        const backgroundImage = reader.result;
        document.body.style.backgroundImage = 'url(\'' + backgroundImage + '\')';
        selectBackgroundText.parentNode.parentNode.style.backgroundImage = 'url(\'' + backgroundImage + '\')';
        localStorage.setItem('background.fileName', file.name);
        localStorage.setItem('background.image', backgroundImage);
        diskSpace.innerText = (getLocalStorageUsage() / 1024 / 1024).toFixed(4) + '/' + (getBrowserStorageLimit());
        // closeOverlay('listBasePart');
    };
}

function resetBackground() {
    selectBackgroundText.innerText = 'select background';
    localStorage.removeItem('background.fileName');
    localStorage.removeItem('background.image');
    selectBackgroundText.parentNode.parentNode.style.backgroundImage = '';
    diskSpace.innerText = (getLocalStorageUsage() / 1024 / 1024).toFixed(4) + '/' + (getBrowserStorageLimit());
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

function getBrowserStorageLimit() {
    var ua = navigator.userAgent;
    var browser;
    var maxSize;

    if (ua.indexOf("Chrome") > -1) {
        browser = "Chrome";
        maxSize = "5";
    } else if (ua.indexOf("Safari") > -1) {
        browser = "Safari";
        maxSize = "2.5";
    } else if (ua.indexOf("Firefox") > -1) {
        browser = "Firefox";
        maxSize = "5";
    } else if (ua.indexOf("Edge") > -1) {
        browser = "Edge";
        maxSize = "5";
    } else if (ua.indexOf("MSIE") > -1 || ua.indexOf("Trident/") > -1) {
        browser = "IE";
        maxSize = "10";
    } else if (ua.indexOf("MicroMessenger") > -1) {
        browser = "WeChat";
        maxSize = "2.5";
    } else {
        browser = "Unknown Browser";
        maxSize = "2.5";
    }

    return maxSize;
}

function getLocalStorageUsage() {
    let totalLength = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const getLocalStorageUsageKey = localStorage.key(i);
        const getLocalStorageUsageValue = localStorage.getItem(getLocalStorageUsageKey);
        totalLength += getLocalStorageUsageKey.length + getLocalStorageUsageValue.length;
    }
    return totalLength;
}

function createTxtFileAndDownload(fileName, fileContent) {
    // 创建一个新的 Blob 对象，将文件内容存储在其中
    const blob = new Blob([fileContent], { type: 'text/plain' });

    // 创建一个 <a> 元素，用于下载文件
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    // 模拟用户点击下载链接
    a.click();

    // 释放 Blob 对象
    URL.revokeObjectURL(a.href);
}

function exportNoteToJson() {
    const notes = {};

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key && key.startsWith("note.")) {
            const noteContent = localStorage.getItem(key);
            notes[key] = noteContent;
        }
    }

    return notes;
}

function exportNote() {
    timeNow = Date.parse(new Date()).toString(16);
    fileName = 'Note backup_' + timeNow + '.txt';
    createTxtFileAndDownload(fileName, JSON.stringify(exportNoteToJson()));
}

function importNote() {
    const importNoteInput = document.getElementById('importNoteInput');
    importNoteInput.click();
}

function importNoteStart() {
    const file = importNoteInput.files[0];
    const reader = new FileReader();

    reader.readAsText(file);
    reader.onload = function () {
        importToLocalStorage(reader.result);
        openMenuPage();
        startUp();
        importNoteInput.value = '';
    };
}

function importToLocalStorage(jsonString) {
    try {
        const jsonObject = JSON.parse(jsonString);
        for (const [key, value] of Object.entries(jsonObject)) {
            localStorage.setItem(key, value);
        }
    } catch (error) {
        Toastify({
            text: "Import failed.",
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
    Toastify({
        text: "Import success.",
        duration: 1200,
        className: "info",
        position: "center",
        gravity: "bottom",
        style: {
            background: "#414141",
        }
    }).showToast();
}

function timeStampToDate(timeStamp) {
    timeStamp = timeStamp / 1;//转换类型
    var date = new Date(timeStamp);
    var Y = date.getFullYear() + '-';
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    var D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
    var h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
    var m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
    var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
    return Y + M + D + h + m + s;
}

function focusOnElement(elementId) {
    const element = document.getElementById(elementId);

    if (element) {
        element.focus();
    } else {
        console.error("Element with ID '" + elementId + "' not found.");
    }
}


function showChangePassword() {
    const standardWindow = document.getElementById('standardWindow');
    const standardInput1 = document.getElementById('standardInput1');
    const standardInput2 = document.getElementById('standardInput2');
    const standardWindowTitle = document.getElementById('standardWindowTitle');
    const standardWindowInfo = document.getElementById('standardWindowInfo');

    standardInput2.parentNode.parentNode.style.display = 'inherit';
    standardWindow.style.display = 'flex';
    standardWindowTitle.innerText = 'Change password';
    standardWindowInfo.innerText = 'Remember your password, if lost it is almost impossible to retrieve.';
    standardInput1.type = 'password';
    standardInput1.autocomplete = "off";
    standardInput2.autocomplete = "off";
    standardInput1.placeholder = 'Old password';
    standardInput2.placeholder = 'New password';
    standardInput1.parentNode.action = 'javascript:focusOnElement(\'standardInput2\')';
    standardInput2.parentNode.action = 'javascript:startChangePassword()';
    scrollControl('deny');
}

function startChangePassword() {
    if (standardInput1.value && standardInput2.value) {
        changePassword(standardInput1.value, standardInput2.value);
    }
}

function changePassword(oldPassword, newPassword) {
    let oldPasswordHash = getSHA3(oldPassword);
    let newPasswordHash = getSHA3(newPassword);
    if (oldPasswordHash == localStorage.getItem('decryptKeyHash')) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            if (key.startsWith('note.')) {
                const encryptedData = localStorage.getItem(key);

                // 解密使用原密钥
                const bytes = CryptoJS.AES.decrypt(encryptedData, oldPassword);
                const originalText = bytes.toString(CryptoJS.enc.Utf8);

                // 使用新密钥加密并覆盖旧值
                const encryptedWithNewKey = CryptoJS.AES.encrypt(originalText, newPassword).toString();
                localStorage.setItem(key, encryptedWithNewKey);

                // 修改密码hash值
                localStorage.setItem('decryptKeyHash', newPasswordHash);

                //修改时间戳
                let oldTimeStamp = decryptAES256(localStorage.getItem('timeStamp.' + key), oldPassword);
                let newTimeStamp = encryptAES256(oldTimeStamp, newPassword);
                localStorage.setItem('timeStamp.' + key, newTimeStamp);
            }
        }
        decryptKey = newPassword;
        Toastify({
            text: "Password changed.",
            duration: 1200,
            className: "info",
            position: "center",
            gravity: "bottom",
            style: {
                background: "#414141",
            }
        }).showToast();
        standardInput1.value = '';
        standardInput2.value = '';
        closeOverlay('standardWindow');
    } else {
        Toastify({
            text: "Wrong password.",
            duration: 3500,
            className: "info",
            position: "center",
            gravity: "top",
            style: {
                background: "#840D23",
            }
        }).showToast();
    }
}

function bodyScroll(event) {
    event.preventDefault();
}

function scrollControl(t) {
    window.scrollTo(0, 0);
    if (t == 'deny') { //禁止滚动
        document.body.addEventListener('wheel', this.bodyScroll, { passive: false });
        document.body.addEventListener('touchmove', this.bodyScroll, { passive: false });

    } else if (t == 'allow') { //开启滚动
        document.body.removeEventListener('wheel', this.bodyScroll, { passive: false });
        document.body.removeEventListener('touchmove', this.bodyScroll, { passive: false });
    }
}
