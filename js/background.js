var enableRender = true;

function sendUrlToAsciidoctorEditor(info, tab) {
    // Send tab.url to Asciidoctor Editor App
    chrome.runtime.sendMessage("jcafjdafpaomnmpffgphdalkdhnnggln", tab.url)
}
chrome.contextMenus.create({
    "title":"Send to Asciidoctor Editor",
    "onclick":sendUrlToAsciidoctorEditor
});

chrome.contextMenus.create({
    "title":"Render selection",
    "contexts":["selection"], "onclick":function (info, tab) {
        var funcToInject = function () {
            var selection = window.getSelection();
            return (selection.rangeCount > 0) ? selection.toString() : '';
        };
        var jsCodeStr = ';(' + funcToInject + ')();';
        chrome.tabs.executeScript({
            code:jsCodeStr,
            allFrames:true
        }, function (selectedTextPerFrame) {
            if (chrome.runtime.lastError) {
                console.log('error:' + chrome.runtime.lastError.message);
            } else if ((selectedTextPerFrame.length > 0) && (typeof(selectedTextPerFrame[0]) === 'string')) {
                var selectedText = selectedTextPerFrame[0];
                chrome.tabs.create({
                    'url':chrome.extension.getURL("html/inject.html"),
                    'active':true
                }, function (tab) {
                    var selfTabId = tab.id;
                    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
                        if (changeInfo.status == "complete" && tabId == selfTabId) {
                            var tabs = chrome.extension.getViews({type:"tab"});
                            tabs[0].inject(selectedText);
                        }
                    });
                });
            }
        });
    }
});

function enableDisableRender() {
    // Save the status of the extension
    chrome.storage.local.set({'ENABLE_RENDER':enableRender});

    // Update the extension icon
    var iconPath = enableRender ? "img/enabled.png" : "img/disabled.png";
    chrome.browserAction.setIcon({path:iconPath});

    // Switch enabled <> disabled
    enableRender = !enableRender;

    // Reload the page
    chrome.tabs.getSelected(null, function (tab) {
        var code = 'window.location.reload();';
        chrome.tabs.executeScript(tab.id, {code:code});
    });
}

function refreshOptions() {
    chrome.storage.local.set({
        'CUSTOM_ATTRIBUTES': localStorage['CUSTOM_ATTRIBUTES'],
        'CUSTOM_JS': localStorage['CUSTOM_JS'],
        'SAFE_MODE': localStorage['SAFE_MODE'],
        'THEME': localStorage['THEME']
    });
}

chrome.browserAction.onClicked.addListener(enableDisableRender);
enableDisableRender();
