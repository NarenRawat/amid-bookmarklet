# AMID-Bookmarklet (Am I Debarred / Dead?)

A bookmarklet for VMSBUTU students that shows your overall attendance percentage for the current semester.

<p align="center">
    <img src="assets/amid-preview.png">
</p>

---

# Installation Guide

You can install the AMID Bookmarklet on **both desktop** and **Android** browsers.  
Follow the instructions below depending on your device.

## Bookmarklet code

Copy the entire code below. You'll use it when creating your bookmark.

```
javascript:(async function () {const pageUrl = "https://online.uktech.ac.in/ums/Student/Public/ViewDetail";if (window.location.href !== pageUrl) {window.location.href = pageUrl;} else {try {const url = "https://narenrawat.github.io/amid-bookmarklet/src/script.js?t=" + Date.now();const res = await fetch(url);const code = await res.text();(1, eval)(code);} catch (e) {alert("Failed to load script: " + e);}}})()
```

## For Desktop (Chrome / Edge / Firefox)

### 1️. Copy the bookmarklet code

### 2. Save it as a bookmark

1. Open your web browser
2. Click the **three dots (⋮)** → **Bookmarks** → **Bookmark manager**.
3. Click **Add new bookmark**.
4. In the box that opens:
    - **Name:** `AMID`
    - **URL:** Paste the bookmarklet code you copied earlier.
5. Click **Save**.

> **Tip:** You can keep the bookmark in your bookmarks bar for quick access.

### 3. Run the bookmarklet

1. Open the attendance page: https://online.uktech.ac.in/ums/Student/Public/ViewDetail
2. Click the **AMID** bookmark from your bookmark bar. (Or you can search "AMID" in the address bar and select the bookmark.)
3. On the first run:
    - If prompted, **open your attendance manually once**.
    - Then run the bookmarklet again to finish setup.
4. You'll see your **attendance report** appear on the page!.

---

## For Android (Chrome)

### 1. Copy the bookmarklet code

### 2. Save it as a bookmark

1. Open https://example.com
2. Tap the **three dots (⋮) → ⭐ Add to Bookmarks**.
3. Tap the **three dots → Bookmarks → Mobile bookmarks**.
4. Find the bookmark you just saved and edit it.
5. Change:
    - **Name:** `AMID`
    - **URL:** Paste the bookmarklet code (make sure it **starts with `javascript:`**).
6. Save.

> **Important:** if the browser removes "`javascript:`" from the start, type it back manually.

### 3. Use the bookmarklet

1. Open the attendance page: https://online.uktech.ac.in/ums/Student/Public/ViewDetail
2. Type `AMID` in the address bar.
3. Tap the bookmarklet name when it appears.
3. On first run:
    - If prompted, open your attendance manually once.
    - Then run the bookmarklet again to finish setup.
4. You'll see your **attendance report** appear right on the page!.