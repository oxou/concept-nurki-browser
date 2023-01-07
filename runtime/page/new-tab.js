//
// Copyright (C) 2022-2023 Nurudin Imsirovic <github.com/oxou>
// Browser - New Tab
//
// Created: 2022-12-25 06:58 PM
// Updated: 2023-01-07 02:26 AM
//

var browserForceURL = "browser://new-tab";
var forceFaviconURL = "page/new-tab.png";

var searchQuery       = document.getElementById("searchQuery");
var submitQuery       = document.getElementById("submitQuery");
var providers         = document.getElementById("providers");
var providersChildren = [];

// Select search providers using Alt+Number
document.body.addEventListener("keyup", function(eventObject) {
    if (eventObject.altKey == true) {
        var key = eventObject.key;
        var decimal = String(key).charCodeAt(0);

        // Only ranges from 1 to 9 can select providers.
        // Any other key can't work
        if (decimal > 47 && 58 > decimal)
            if (typeof (providerId = searchProvider.keys[Number(key - 1)]) !== "undefined")
                searchProvider.select(providerId);
    }
});

document.body.addEventListener("click", function(eventObject) {
    var target = eventObject.target;

    if (target instanceof HTMLButtonElement)
        if ((providerId = target.getAttribute("data-id")) != null)
            searchProvider.select(providerId);
});

var searchProvider = {};
searchProvider.list = {};
searchProvider.selected = "google";

searchProvider.list = {
    google: {
        name: "Google",
        url: "https://www.google.com/search?q={query}&hl=en"
    },
    duckduckgo: {
        name: "DuckDuckGo",
        url: "https://duckduckgo.com/?q={query}"
    },
    wikipedia: {
        name: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/Special:Search?search={query}"
    },
    bing: {
        name: "Bing",
        url: "https://www.bing.com/search?q={query}"
    }
};

searchProvider.keys = Object.keys(searchProvider.list);
searchProvider.keysLength = searchProvider.keys.length;
searchProvider.keyWidthRelativeToLength = 100 / searchProvider.keysLength;

// Populate #providers with searchProvider.list objects
for (let i = 0, j = searchProvider.keysLength; i < j; i++) {
    var providerObject = searchProvider.list[searchProvider.keys[i]];

    var providerButton = document.createElement("button");
    providerButton.setAttribute("data-selected", '0');
    providerButton.setAttribute("data-id", providerObject.name.toLowerCase());
    providerButton.innerText = providerObject.name;

    providerButton.style.width = searchProvider.keyWidthRelativeToLength + '%';
    providerObject.button = providerButton;

    providers.append(providerButton);
}

searchProvider.execute = function() {
    var currentProvider = searchProvider.selected;
    currentProvider = searchProvider.list[currentProvider];

    var searchQueryValue = searchQuery.value.trim();

    if (searchQueryValue.length == 0)
        return;

    searchQueryValue = encodeURIComponent(searchQueryValue);

    var nextUrl = currentProvider.url.replace("{query}", searchQueryValue);

    window.location.href = nextUrl;
}

searchProvider.select = function(providerId) {
    searchProvider.selected = providerId;

    for (let i = 0, j = searchProvider.keysLength; i < j; i++) {
        var providerButton = searchProvider.list[searchProvider.keys[i]].button;

        if (providerButton.getAttribute("data-id") == providerId)
            providerButton.setAttribute("data-selected", '1');
        else
            providerButton.setAttribute("data-selected", '0');
    }

    searchQuery.focus();
}

searchQuery.addEventListener("keyup", function(eventObject) {
    if (eventObject.key == "Enter") {
        eventObject.preventDefault();
        submitQuery.focus();
        submitQuery.click();
    }
});

submitQuery.addEventListener("click", function() {
    searchProvider.execute();
});

// Initialize
searchProvider.select(searchProvider.selected);
