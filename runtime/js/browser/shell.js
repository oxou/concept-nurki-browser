//
// Copyright (C) 2022-2023 Nurudin Imsirovic <github.com/oxou>
// Browser Shell
//
// Created: 2022-12-25 02:18 PM
// Updated: 2023-01-05 05:32 PM
//

var browserShell            = windowFrame.querySelector("browser-shell");
var browserShellNav         = browserShell.querySelector("navigation");
var browserShellNavButtons  = browserShellNav.querySelectorAll("data-buttons button");
var browserShellAddress     = browserShellNav.querySelector("data-address");
var browserShellAddressURL  = browserShellAddress.querySelector("data-url");
var browserFrameQRCode      = browserShell.querySelector("browser-frame-qrcode");
var browserFrameQRCodeImage = browserFrameQRCode.querySelector("img");
var browserFrameOptionsMenu = browserShell.querySelector("browser-frame-options-menu");

var browserMenusParent = windowFrame.parentElement.querySelector("menus");
var browserMenus = [];

// The "browserFrame", "browserTabFrames" and "frame" of the tab-frame (or iframe) are unrelated
// with browserOptionFrames. I should have made a different naming convention regarding these
// objects, but because this project is just a concept it won't matter that much.
//
// In the future a different approach will be used to build such a thing, on a real browser!
var browserOptionFrames = [];

var browserSpoofedUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36";
var browserURLNewTab = "./page/new-tab.html";
var browserURLAbout  = "./page/about.html";

var browserTabContainer = windowTitlebar.querySelector("browser-tab-container");
var browserTabs = []; // All available tabs are kept here, each use UUID as index

var browserTabFrames = windowInner.querySelector("browser-tab-frames");
var browserTabFramesChildren = [];

function browserShellSetAddressURL(url) {
    browserShellAddressURL.innerText = url;
}

function browserShellGetAddressURL() {
    var cw = browserTabState.frame.contentWindow;
    var forceURL = cw.window.browserForceURL ?? null;

    if (forceURL != null)
        return forceURL;

    return cw.window.location.href;
}

function updateBrowserTabsArray() {
    tabs = browserTabContainer.querySelectorAll("browser-tab");
    var list = {};

    // Assign UUID indexes for easier lookup by other functions
    tabs.forEach(function(tab) {
        var uuid = tab.getAttribute("data-uuid");
        list[uuid] = tab;
    });

    browserTabs = list;
}

function updateBrowserFramesArray() {
    frames = browserTabFrames.querySelectorAll("tab-frame");
    var list = [];

    // Assign UUID indexes for easier lookup by other functions
    frames.forEach(function(frame) {
        var uuid = frame.getAttribute("data-uuid");
        list[uuid] = frame;
    });

    browserTabFramesChildren = list;
}

function browserCreateNewTab(url, autofocus = false, fixUrl = true) {
    var uuid = generateUUID();

    var tab = document.createElement("browser-tab");
    var icon = document.createElement("data-icon");
    var text = document.createElement("data-text");
    var exit = document.createElement("button");
    tab.setAttribute("class", "dynamic-width");
    exit.setAttribute("shell-action", "browser.tab.exit");
    exit.setAttribute("class", "tab-exit");

    var urlProto = '';
    var iconUrl = '';

    if (fixUrl == true) {
        // Add missing protocol
        if (!url.includes("http"))
            if (!url.includes("://"))
                url = "http://" + url;
            else
                url = "http" + url;

        // Figure out the protocol
        urlProto = url.split(':')[0];

        // Figure out the path to favicon
        iconUrl = urlProto + "://" + url.split('/')[2] + "/favicon.ico";
    }

    icon.style.backgroundImage = "url(\"" + iconUrl + "\")";

    tab.setAttribute("data-uuid", uuid);
    tab.append(icon, text, exit);
    browserTabContainer.append(tab);

    tabFrameInfo = browserCreateTabFrame(url, uuid, autofocus);

    updateBrowserTabsArray();
    updateBrowserFramesArray();
    backendUpdateDynamicTabWidth();

    if (autofocus)
        browserFocusTabFrame(uuid);
}

function browserCreateTabFrame(url, uuid, autofocus = true) {
    var tabFrame = document.createElement("tab-frame");
    tabFrame.setAttribute("data-uuid", uuid);
    tabFrame.setAttribute("data-focused", Number(autofocus));
    var iframe = document.createElement("iframe");

    // nwjs hack to allow loading of cross-origin domains
    iframe.setAttribute("nwdisable", '');
    iframe.setAttribute("nwfaketop", '');
    iframe.setAttribute("nwUserAgent", browserSpoofedUserAgent);
    iframe.setAttribute("src", url);
    iframe.setAttribute("class", "tab-frame");
    iframe.uuid = uuid;

    // We need this monstrosity to solve a dumb mistake that Chrome
    // still has not fixed in 5 years
    iframe.browserFix = {};
    iframe.browserFix.scrollTop = 0;
    iframe.browserFix.scrollLeft = 0;

    // Iframe onload event handler
    iframe.addEventListener("load", function() {
        // Update tab state only when the active tab
        // is the same where the event fired
        if (iframe.uuid == browserTabState.uuid)
            browserUpdateTabState(iframe.uuid);

        // Update address bar
        browserShellSetAddressURL(browserTabState.url);
    });

    // Iframe interval for the document.title.
    // The reason we need this is because onload is slow, and the title does not update immediately.
    // We'll add a 250 miliseconds interval to constantly query for the document.title, and fallback to an
    // empty value if failed for whatever reason.
    iframe.browserIntervals = {};
    iframe.browserIntervals.documentTitle = setInterval(function() {
        var title = '';

        try {
            title = iframe.contentWindow.document.title;
        } catch(e) {}

        // Update window title and tabs' title and favicon
        windowHandleSetTitle(title);
        browserTabUpdateChildren(
            iframe.uuid,
            title,
            iframe.contentWindow.window.location.href,
            iframe.contentWindow.forceFaviconURL ?? null
        );
    }, 250);

    tabFrame.append(iframe);
    browserTabFrames.append(tabFrame);

    return [tabFrame, iframe];
}

function browserFocusTabFrame(uuid) {
    Object.keys(browserTabFramesChildren).forEach(function(uuidInternal) {
        if (uuid == uuidInternal) {
            var iframe = browserTabFramesChildren[uuid].querySelector("iframe");

            browserTabFramesChildren[uuid].style.display = "block";
            browserTabs[uuid].setAttribute("data-focused", '1');

            // Fix iframe bug
            iframe.contentWindow.document.documentElement.scrollTop = iframe.browserFix.scrollTop;
            iframe.contentWindow.document.documentElement.scrollLeft = iframe.browserFix.scrollLeft;

            browserUpdateTabState(uuid);
            browserShellSetAddressURL(browserTabState.url);
        } else {
            var iframe = browserTabFramesChildren[uuidInternal].querySelector("iframe");

            // Fix iframe bug
            iframe.browserFix.scrollTop = iframe.contentWindow.document.documentElement.scrollTop;
            iframe.browserFix.scrollLeft = iframe.contentWindow.document.documentElement.scrollLeft;

            browserTabFramesChildren[uuidInternal].style.display = "none";
            browserTabs[uuidInternal].setAttribute("data-focused", '0');
        }
    });
}

function browserDestroyTabTrack(uuid) {
    var elementReference = browserTabContainer.querySelector("browser-tab[data-uuid=\"" + uuid + "\"]") ?? null;

    if (elementReference != null)
        elementReference.remove();
}

function browserDestroyTabFrame(uuid) {
    var elementReference = browserTabFrames.querySelector("tab-frame[data-uuid=\"" + uuid + "\"]") ?? null;

    if (elementReference == null)
        return false;

    var iframe = elementReference.querySelector("iframe");
    Object.keys(iframe.browserIntervals).forEach(function(key) {
        clearInterval(iframe.browserIntervals[key]);
    });

    elementReference.remove();
    return true;
}

function browserDestroyTabInstance(uuid) {
    var indexRelativeToTab = Object.keys(browserTabs).join(',').indexOf(uuid);
    indexRelativeToTab /= 36 + 1 /* size of UUID + 1 for , */

    browserDestroyTabFrame(uuid);
    browserDestroyTabTrack(uuid);

    updateBrowserTabsArray();
    updateBrowserFramesArray();
    backendUpdateDynamicTabWidth();

    var tabIndexes    = Object.keys(browserTabs);
    var tabIndexBack  = tabIndexes[indexRelativeToTab - 1] ?? null;
    var tabIndexFront = tabIndexes[indexRelativeToTab] ?? null;
    var nextTabIndex  = null;

    // Take focus of the nearest tab ahead.
    // If the tab index is at the end then
    // focus nearest tab behind
    //
    // If tabIndexFront does not exist, we fallback to Behind,
    // in case behind does not exist, we fallback to "No Tabs Open"
    if (tabIndexFront != null)
        nextTabIndex = tabIndexFront;
    else
        nextTabIndex = tabIndexBack;

    // Only focus the mutual tabs if the currently focused tab UUID
    // is the same as the one being destroyed
    if (uuid == browserTabState.uuid) {
        var nextTab = browserTabFramesChildren[nextTabIndex] ?? null;
        if (nextTab != null) {
            var nextTabTitle = nextTab
                             .querySelector("iframe")
                             .contentWindow
                             .document
                             .title
                             .toString();

            var nextTabUUID = nextTab.getAttribute("data-uuid") ?? null;

            windowHandleSetTitle(nextTabTitle);
            browserFocusTabFrame(nextTabUUID);
        }
    }

    // If no tabs are left, clear address bar and tab state
    if (tabIndexBack == null && tabIndexFront == null) {
        browserShellSetAddressURL('');
        browserDiscardTabState();
    }
}

function browserMakeQRCode(url) {
    var tempElement = document.createElement("div");

    if (url == null || url.trim().length == 0)
        return false;

    var qrcode = new QRCode(tempElement, {
        text: url,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    tempElement.remove();

    return true;
}

function browserTabGetForceURL(frame) {
    return frame.contentWindow.window.browserForceURL ?? null;
}

function browserUpdateTabState(uuid) {
    var tabFrame = browserTabFramesChildren[uuid] ?? null;

    if (tabFrame == null)
        return false;

    browserTabState.uuid    = uuid;
    browserTabState.parent  = browserTabFramesChildren[uuid];
    browserTabState.frame   = browserTabState.parent.querySelector("iframe");
    browserTabState.url     = browserTabState.frame.contentWindow.window.location.href.toString();
    browserTabState.realURL = browserTabState.url;

    if ((forceURL = browserTabGetForceURL(browserTabState.frame)) != null)
        browserTabState.url = forceURL;

    return true;
}

function browserDiscardTabState() {
    browserTabState.uuid =
    browserTabState.parent =
    browserTabState.frame =
    browserTabState.url =
    browserTabState.realURL = null;
}

function browserTabUpdateChildren(uuid, title, url, forceFavicon = null) {
    var tab = browserTabs[uuid];
    var icon = tab.querySelector("data-icon");
    var text = tab.querySelector("data-text");
    text.innerText = title;

    if (forceFavicon != null)
        url = forceFavicon;
    else
        url = "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url="
            + encodeURIComponent(url);

    var additional = '';

    if (forceFavicon == null)
        additional = "&size=" + (16 * window.devicePixelRatio); // Needed for different resolution scaling

    icon.style.background = (
        "url(\"" +
        url +
        additional +
        "\")"
    );
}

function browserTabGotoURL(url) {
    browserTabState.frame.contentWindow.window.location.href = url;
}

function backendUpdateDynamicTabWidth() {
    var style = backendChildrenRef["dynamic-tab-width"].querySelector("style");
    var width = 100 / Object.keys(browserTabs).length;

    if (width == 0)
        width = "180px";
    else
        width = "calc(" + width + "% - 15px)";

    style.innerHTML = "browser-tab.dynamic-width {width:" + width + " !important;}";
}

function browserInitMenus() {
    var buffer = browserMenusParent.querySelectorAll("menu[data-id]");

    buffer.forEach(function(menu) {
        var key = String(menu.getAttribute("data-id"));
        browserMenus[key] = menu;
        menu.setAttribute("data-hidden", '1');
    });

    return buffer.length > 0; // will return false if no menu is available
}

function browserHideAllMenus() {
    browserMenusParent.setAttribute("data-hidden", '0');

    if (Object.keys(browserMenus).length == 0)
        return;

    Object.values(browserMenus).forEach(function(menu) {
        menu.setAttribute("data-hidden", '1');
    });
}

function browserSpawnMenu(menuID, eventObject) {
    if (!(eventObject instanceof Object))
        return false;

    browserHideAllMenus();
    browserMenusParent.setAttribute("data-hidden", '0');

    var menu = browserMenus[menuID];

    menu.setAttribute("data-hidden", '0');

    menu.style.left = eventObject.pageX + "px";
    menu.style.top = eventObject.pageY + "px";
}

function browserMenuGetVisible() {
    for (let i = 0, j = Object.keys(browserMenus), l = j.length; i < l; i++) {
        var menu = browserMenus[j[i]];

        if (menu.getAttribute("data-hidden") === '0')
            return String(menu.getAttribute("data-id"));
    }

    return null;
}

function browserGetIframeByUUID(uuid) {
    if (typeof (iframe = browserTabFramesChildren[uuid]) !== "undefined")
        return iframe.querySelector("iframe");

    return null;
}

function browserIframeReload(iframe) {
    iframe.contentWindow.window.location.reload();
}

function browserTabDuplicate(uuid, autofocus = true) {
    var iframe = browserGetIframeByUUID(uuid);

    browserCreateNewTab(
        iframe.contentWindow.window.location.href,
        autofocus,
        false
    );

    if (!autofocus)
        browserFocusTabFrame(uuid);
}

function browserDestroyTabInstancesAlongside(uuid) {
    Object.keys(browserTabFramesChildren).forEach(function(tabUUID) {
        if (tabUUID != uuid)
            browserDestroyTabInstance(tabUUID);
    });
}

function browserGetAddressScheme(url = null) {
    if (url == null)
        url = browserShellGetAddressURL();

    if (url.trim().length == 0)
        return null;

    if ((index = url.indexOf("://")) != -1)
        return url.substring(0, index);

    return null;
}

function browserShellAddressCopyURL() {
    var url = browserShellGetAddressURL();
    clipboardWrite(url);
}

function browserShellAddressCopyPath() {
    var url = browserShellGetAddressURL();
    var parts = url.split("/");
    var path = "";

    for (let i = 3, j = parts.length; i < j; i++)
        path += '/' + parts[i];

    return path;
}

function hideOtherMenuLikeElements() {
    browserFrameQRCode.setAttribute("data-hidden", '1');
    browserFrameOptionsMenu.setAttribute("data-hidden", '1');
}
