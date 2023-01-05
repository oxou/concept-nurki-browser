//
// Copyright (C) 2022-2023 Nurudin Imsirovic <github.com/oxou>
//
// Holds the reference to the backend element, and all its children.
// This element is used to store pseudo-like elements for various operations,
// for example the QRCode must store the image element somewhere, and it uses
// backend...pseudo-element-qrcode to store the output.
//
// Created: 2022-12-31 02:36 PM
// Updated: 2022-12-31 02:49 PM
//

var backend = windowFrame.parentElement.querySelector("backend");
var backendChildren = [];
var backendChildrenRef = [];

backend.querySelectorAll('*').forEach(function(element) {
    if (element.parentElement.nodeName === "BACKEND") {
        backendChildren.push(element);
        backendChildrenRef[element.nodeName.toLowerCase()] = element;
    }
});
