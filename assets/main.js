const decryptKey = atob("SnFhM0VnZHNzVmxnTUhZS3RuOGM=");

var ifFirstTimeChange = 0;

// 创建一个观察器实例并传入回调函数
var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        if (mutation.type == 'characterData' || mutation.type == 'childList') {
            saveToLS();
            // 如果noteArea发生变动，清除旧的定时器并设置新的定时器
            if (toastTimeout) clearTimeout(toastTimeout);
            toastTimeout = setTimeout(function () {
                if (ifFirstTimeChange == 0) {
                    ifFirstTimeChange += 1
                    return;
                }
                Toastify({
                    text: "note saved.",
                    duration: 1200,
                    className: "info",
                    position: "center",
                    gravity: "bottom",
                    style: {
                        background: "#414141",
                    }
                }).showToast();
            }, 1500);
        }
    });
});

// 配置观察选项:
var config = { attributes: true, childList: true, characterData: true, subtree: true };

// 传入目标节点和观察选项
observer.observe(noteArea, config);

// 初始化定时器变量
var toastTimeout;


noteArea.addEventListener('paste', function(e) {
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
    var localNote = readFromLS();
    if (localNote) {
        noteArea.innerText = localNote;
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
        resetKeyText.innerText = 'confirm';
        return;
    }

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
}

function saveToLS() {
    const noteArea = document.getElementById('noteArea');
    localStorage.setItem("note.1", encryptAES256(noteArea.innerText, decryptKey));
}

function readFromLS() {
    if (!localStorage.getItem("note.1")) {
        return;
    }
    return decryptAES256(localStorage.getItem("note.1"), decryptKey);
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

