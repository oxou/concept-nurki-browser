//
// Copyright (C) 2022-2023 Nurudin Imsirovic <github.com/oxou>
// Holds the state of the active tab
//
// Created: 2022-12-25 04:53 PM
// Updated: 2022-12-31 04:09 PM
//

var browserTabState = {};

browserTabState.uuid = ""; // string
browserTabState.frame = null; // HTMLIFrameElement
browserTabState.parent = null;
browserTabState.url = null; // If no browserForceURL is present, then realURL is used
browserTabState.realURL = null;
