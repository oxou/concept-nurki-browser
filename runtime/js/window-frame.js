//
// Copyright (C) 2022-2023 Nurudin Imsirovic <github.com/oxou>
// Initialize NW.js Custom Window Frame
//
// Created: 2022-12-25 03:37 AM
// Updated: 2023-01-05 05:21 PM
//

// /!\ Only a single window-frame element must be present!
var windowHandle = nw.Window.get();

var windowFrame    = document      .querySelector("window-frame");
var windowTitlebar = windowFrame   .querySelector("window-titlebar");
var windowIcon     = windowTitlebar.querySelector("data-icon");
var windowTitle    = windowTitlebar.querySelector("data-text");
var windowButtons  = windowTitlebar.querySelector("window-buttons");
var windowInner    = windowFrame   .querySelector("window-inner");

var windowButtonsChildren = [];

// Allow multiple instances
nw.App.on("open", function() {
    nw.Window.open(
        windowHandle.cWindow.tabs[0].url,
        nw.App.manifest.window
    );
});

windowHandle.on("restore", function() {
    windowButtonsChildren["maximize"].setAttribute("data-can-restore", '0');
});

windowHandle.on("maximize", function() {
    windowButtonsChildren["maximize"].setAttribute("data-can-restore", '1');
});

windowHandle.on("resize", function() {
    browserHideAllMenus();
});

function windowHandleMaximize() {
    if (windowHandle.cWindow.state == "maximized")
        windowHandle.restore();
    else
        windowHandle.maximize();
}

function windowHandleClose() {
    windowHandle.close();
}

function windowHandleMinimize() {
    windowHandle.minimize();
}

function windowHandleSetTitle(title) {
    document.title = title;

    if (windowTitle != null)
        windowTitle.innerText = title;
}

// Initialize window titlebar buttons
(function() {
    // Create button definitions for Windows >= 10 platforms

    // Close
    var buttonClose = document.createElement("button");
    buttonClose.className = "close";
    buttonClose.onclick = windowHandleClose;
    windowButtonsChildren["close"] = buttonClose;

    // Minimize
    var buttonMinimize = document.createElement("button");
    buttonMinimize.className = "minimize";
    buttonMinimize.onclick = windowHandleMinimize;
    windowButtonsChildren["minimize"] = buttonMinimize;

    // Maximize
    var buttonMaximize = document.createElement("button");
    buttonMaximize.className = "maximize";
    buttonMaximize.setAttribute("data-can-restore", "0");
    buttonMaximize.onclick = windowHandleMaximize;
    windowButtonsChildren["maximize"] = buttonMaximize;

    // Now register the window titlebar buttons
    if ((buttonsInit = windowButtons.getAttribute("data-init")) !== null) {
        buttonsInit = buttonsInit.split(',');

        for (let i = 0, j = buttonsInit.length; i < j; i++) {
            var buttonName = buttonsInit[i]

            if (typeof (buttonElement = windowButtonsChildren[buttonName]) !== "undefined")
                windowButtons.appendChild(buttonElement);
        }
    }
})();
