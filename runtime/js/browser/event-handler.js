//
// Copyright (C) 2022-2023 Nurudin Imsirovic <github.com/oxou>
// Handles browser shell events, opening new tabs, clicking on navigation
// buttons, address bar, and much more.
//
// Created: 2022-12-25 05:35 PM
// Updated: 2023-01-06 12:47 AM
//

windowFrame.addEventListener("auxclick", function(eventObject) {
    var target = eventObject.target;
    var parent = target.parentElement;

    // Go one step deeper
    if (parent.nodeName == "BROWSER-TAB") {
        target = parent;
        parent = target.parentElement;
    }

    // If conditions are met the page is closed
    if (target.nodeName == "BROWSER-TAB" &&
        parent.nodeName == "BROWSER-TAB-CONTAINER" &&
        eventObject.button == 1 /* middle click */) {
        var uuid = target.getAttribute("data-uuid");
        browserDestroyTabInstance(uuid);
        return;
    }
});

windowFrame.addEventListener("keydown", function(eventObject) {
    var ctrlKey = eventObject.ctrlKey;

    // Combo: CTRL+L
    // Focus and select the address bar
    if (ctrlKey && eventObject.key == 'l') {
        document.activeElement.blur();
        browserShellAddressURL.focus();
        browserHideAllMenus();
        hideOtherMenuLikeElements();
        return;
    }

    // Combo: CTRL+C
    // If the address bar is focused, you can copy the URL without needing to select everything
    if (ctrlKey && eventObject.key == 'c') {
        var aE = document.activeElement;

        if (aE.nodeName == "DATA-URL" && aE.parentElement.nodeName == "DATA-ADDRESS")
            clipboardWrite(aE.innerText);

        return;
    }

    // Handle creation of tabs using CTRL+T
    // Only one tab will be created per press
    if (ctrlKey && eventObject.key == 't' && windowFrame.blockNewTabEvent != true) {
        browserCreateNewTab(browserURLNewTab, true, false);
        windowFrame.blockNewTabEvent = true;
        return;
    }

    // Detect if the key was pressed inside the address bar <data-url> element
    if (document.activeElement.parentElement.nodeName == "DATA-ADDRESS") {
        if (document.activeElement.nodeName == "DATA-URL") {
            if (eventObject.key == "Enter") {
                var aE = document.activeElement;
                eventObject.preventDefault();
                aE.blur();

                // If the enter key is pressed, prevent the default event and
                // instead initiate a Google search and if there is <scheme>://
                // in the URL then navigate to that URL instead of Googling
                var url = aE.innerText;

                if (isValidScheme(url))
                    browserTabGotoURL(url);
                else
                    browserTabGotoURL("https://www.google.com/search?q=" + encodeURIComponent(url) + "&hl=en");

                return;
            }
        }
    }
});

windowFrame.addEventListener("keyup", function() {
    windowFrame.blockNewTabEvent = false;
});

windowFrame.addEventListener("click", function(eventObject) {
    var target = eventObject.target;
    var parent = target.parentElement;

    var shellAction = target.getAttribute("shell-action") ?? null;

    // Focus on a tab
    if (shellAction != "browser.tab.exit") {
        if (parent.nodeName == "BROWSER-TAB") {
            if (parent.parentElement.nodeName == "BROWSER-TAB-CONTAINER") {
                var uuid = parent.getAttribute("data-uuid");
                browserFocusTabFrame(uuid);
                windowHandleSetTitle(browserTabState.frame.contentWindow.document.title);
                return;
            }
        }
    }

    // Create new tab
    if (shellAction == "browser.tab.new" ||
        shellAction == "browser.opt.new-tab") {
        hideOtherMenuLikeElements();
        var autofocus = !eventObject.shiftKey;
        browserCreateNewTab("./page/new-tab.html", autofocus, false);
        return;
    }

    // Print page
    if (shellAction == "browser.opt.print") {
        browserTabState.frame.contentWindow.print();
        return;
    }

    if (shellAction == "browser.opt.about") {
        browserCreateNewTab(browserURLAbout, true, false);
        return;
    }

    if (shellAction == "browser.opt.exit") {
        windowHandle.close();
        return;
    }

    // Close tab
    if (shellAction == "browser.tab.exit") {
        var uuid = parent.getAttribute("data-uuid");
        browserDestroyTabInstance(uuid);
        return;
    }

    // Navigate next
    if (shellAction == "browser.navigate.next") {
        browserTabState.frame.contentWindow.history.forward();
        return;
    }

    // Navigate back
    if (shellAction == "browser.navigate.prev") {
        browserTabState.frame.contentWindow.history.back();
        return;
    }

    // Navigate home
    if (shellAction == "browser.navigate.home") {
        browserTabState.frame.contentWindow.location.href = browserUrlNewTab;
        return;
    }

    // Reload page
    if (shellAction == "browser.navigate.reload") {
        browserTabState.frame.contentWindow.location.href = browserTabState.frame.contentWindow.location.href;
        return;
    }

    // Make QR code of the URL
    if (shellAction == "browser.tab.make.qr_code" ||
        shellAction == "item.address.get.qr-code") {
        var status = browserMakeQRCode(browserTabState.url);
        hideOtherMenuLikeElements();

        if (status != false) {
            browserFrameQRCode.setAttribute("data-hidden", "0");
        } else {
            browserFrameQRCodeImage.src = '';
            browserFrameQRCode.setAttribute("data-hidden", "1");
        }

        return;
    }

    // Close the QR code option frame
    if (shellAction == "browser.frame.qr.close") {
        browserFrameQRCode.setAttribute("data-hidden", "1");
        return;
    }

    // Close the Menu option frame
    if (shellAction == "browser.nav.options.menu") {
        var boolDisplay = browserFrameOptionsMenu.getAttribute("data-hidden");

        if (boolDisplay == '0')
            hideOtherMenuLikeElements();

        if (boolDisplay == "1")
            browserFrameOptionsMenu.setAttribute("data-hidden", '0');
        else
            browserFrameOptionsMenu.setAttribute("data-hidden", '1');

        return;
    }

    // Reload tab
    if (shellAction == "item.tab.reload") {
        var iframe = browserGetIframeByUUID(parent.tabUUID);
        browserIframeReload(iframe);
        browserHideAllMenus();
        return;
    }

    // Duplicate tab
    if (shellAction == "item.tab.duplicate") {
        browserTabDuplicate(parent.tabUUID, !eventObject.shiftKey);
        return;
    }

    // Close tab
    if (shellAction == "item.tab.close") {
        browserDestroyTabInstance(parent.tabUUID);
        return;
    }

    // Close other tabs
    if (shellAction == "item.tab.close-other-tabs") {
        browserDestroyTabInstancesAlongside(parent.tabUUID);
        return;
    }

    if (shellAction == "item.address.copy.url") {
        browserShellAddressCopyURL();
        return;
    }

    // Any open menus will be hidden once this part is reached.
    browserHideAllMenus();
});

windowFrame.addEventListener("mousedown", function(eventObject) {
    var target = eventObject.target;
    var parent = target.parentElement;

    var uuid = parent.getAttribute("data-uuid") ?? null;

    /* Right-click / Context Menu */
    if (eventObject.which == 3) {
        eventObject.preventDefault();

        // Handle right click for browser tabs
        if (parent.nodeName == "BROWSER-TAB") {
            if (parent.parentElement.nodeName == "BROWSER-TAB-CONTAINER") {
                browserHideAllMenus();
                browserSpawnMenu("tab-menu", eventObject);
                browserMenus["tab-menu"].tabUUID = uuid;
                return;
            }
        }

        // Handle right click for address bar
        if (parent.parentElement.nodeName == "NAVIGATION") {
            if (parent.nodeName == "DATA-ADDRESS") {
                browserHideAllMenus();
                browserSpawnMenu("address-bar", eventObject);
                browserMenus["address-bar"].tabUUID = uuid;
                return;
            }
        }
    }
});

windowFrame.addEventListener("contextmenu", function(eventObject) {
    eventObject.preventDefault();
});
