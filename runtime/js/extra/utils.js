//
// Copyright (C) 2022-2023 Nurudin Imsirovic <github.com/oxou>
// Utility Functions
//
// Created: 2022-12-25 04:17 PM
// Updated: 2023-01-04 02:07 PM
//

function charFromRange(start = -1, end = -1) {
    if (start == -1 || end == -1)
        return '';

    // limit to 127 <= AND non-negative
    end = end > 127 ? 127 : end;
    end = 0 > end ? -end : end;

    start = start > 127 ? 126 : start;
    start = 0 > start ? -start : start;

    var rand = Math.floor(Math.random(0) * 127);

    if (rand >= start && end >= rand)
        return String.fromCharCode(rand);
    else
        return charFromRange(start, end);
}

function generateHexCharacter() {
    var c = Math.floor(Math.random(0) * 127);

    if (c > 47 && 58 > c || c > 96 && 103 > c)
        return String.fromCharCode(c);
    else
        return generateHexCharacter();
}

function generateUUID() {
    var buf = ['', '', '', '', ''];

    var l1 = 0; // 8
    var l2 = 0; // 4
    var l3 = 0; // 4
    var l4 = 0; // 4
    var l5 = 0; // 12

    while (l1++ != 8)
        buf[0] += generateHexCharacter();

    while (l2++ != 4)
        buf[1] += generateHexCharacter();

    while (l3++ != 4)
        buf[2] += generateHexCharacter();

    while (l4++ != 4)
        buf[3] += generateHexCharacter();

    while (l5++ != 12)
        buf[4] += generateHexCharacter();

    return buf.join('-');
}

function clipboardWrite(value) {
    navigator.clipboard.writeText(value);
}

function isValidScheme(url) {
    return (url.substring(3, 6) === "://" ||
            url.substring(4, 7) === "://" ||
            url.substring(5, 8) === "://");
}
