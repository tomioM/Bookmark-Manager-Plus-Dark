
'use strict';

var bookmarkData;

var badgeType;

$(document).ready(function() {
	
	// register refreshTree listeners
	chrome.bookmarks.onCreated.addListener(refreshTree);
	chrome.bookmarks.onRemoved.addListener(refreshTree);
	chrome.bookmarks.onChanged.addListener(refreshTree);
	//chrome.bookmarks.onMoved.addListener(refreshTree);
	//chrome.bookmarks.onChildrenReordered.addListener(refreshTree);
	chrome.bookmarks.onImportEnded.addListener(refreshTree);
	refreshTree();
	
	chrome.tabs.onUpdated.addListener(updateBadgeText);
	
	chrome.storage.onChanged.addListener(updateBadgeTextType);
	updateBadgeTextType();
	
	chrome.tabs.onActivated.addListener(function(activeInfo) {
		chrome.tabs.get(activeInfo.tabId, function(tab){
			updateBadgeText(undefined, undefined, tab);
		});
	}); 
});

function refreshTree() {
	chrome.bookmarks.search({}, function(results) {
		//handleRuntimeError();
		bookmarkData = results;
		
		chrome.tabs.query({
			active: true, 
			currentWindow: true
		}, function(tabs) {
			updateBadgeText(undefined, undefined, tabs[0]);
		});
	});
}

function updateBadgeText(tabId, changeInfo, tab) {
	
	console.log("updateBadgeText");
	
	var results = bookmarkData;
	
	// how many pages are bookmarked with the current domain?
	if(badgeType == "domain") {
		
		var reg = /:\/\/[^/]*/;
		var url = reg.exec(tab.url)[0];
	
		var count = 0;
		
		for (var i = 0; i < results.length; i++) {
			if(results[i].url == undefined) continue;
			if(results[i].url.includes(url)) count++;
		}
		
		setBadgeText(count);
		
	// how many pages are bookmarked entirely?
	} else if(badgeType == "total") {
		
		var count = 0;
		
		for (var i = 0; i < results.length; i++) {
			if(results[i].url == undefined) continue;
			count++;
		}
		
		setBadgeText(count);
		
	// how many pages are bookmarked today?
	} else if(badgeType == "today") {
		
		var startTime = new Date().setHours(0,0,0,0);
		var endTime = new Date().setHours(24,0,0,0);
	
		var count = 0;
		
		for (var i = 0; i < results.length; i++) {
			if(results[i].url == undefined) continue;
			if(results[i].dateAdded < startTime) continue;
			if(results[i].dateAdded > endTime) continue;
			count++;
		}
		
		setBadgeText(count);
		
	// none
	} else {
		setBadgeText("");
	}
	
	
}

function updateBadgeTextType() {
	
	console.log("updateBadgeTextType");
	
	chrome.storage.sync.get({
		badge: "domain",
	}, function(items) {
		badgeType = items.badge;
	});
	
	chrome.tabs.query({
		active: true, 
		currentWindow: true,
	}, function(tabs) {
		updateBadgeText(undefined, undefined, tabs[0]);
	});
	
}

function setBadgeText(count) {
	if(count > 999) {
		count = parseInt(count / 1000) + "k";
	}
	if(count > 999999) {
		count = parseInt(count / 1000000) + "m";
	}
	chrome.browserAction.setBadgeText({text: count.toString()});
}


// BOOKMARKIE BACKGROUND CODE FOR DARKMODE
import Canvg, { presets } from 'canvg';


const storageCache = {};

/** @todo will be deprecated on MV3 */
let isBrowserDark = window.matchMedia("(prefers-color-scheme: dark)").matches || chrome.extension.inIncognitoContext;

const initStorageCache = getAllStorageSyncData().then(items => {
  Object.assign(storageCache, items);
  setIcon(storageCache.iconType, storageCache.iconStyle, storageCache.iconStyleAuto, isBrowserDark);
});

function getAllStorageSyncData() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(null, (items) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(items);
    });
  });
}

const setIcon = async (iconType = 'star', iconStyle = 'dark', iconStyleAuto = true, isBrowserDark = false) => {
    if (iconStyleAuto) {
      if (isBrowserDark) {
              iconStyle = 'light';
      } else {
        iconStyle = 'dark';
      }
    }
    
    const fill = {
        dark: '#444',
        light: '#fff',
        trinidad: '#d74c2e',
        yellow: '#f4a60e',
        pastel: '#6ad37c',
        naval: '#4277d7',
        orchid: '#993fd6',
        gold: ''
    };

    const svg = {
        star: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 23.6995L24.652 29L22.356 19.01L30 12.2884L19.934 11.4216L16 2L12.066 11.4216L2 12.2884L9.644 19.01L7.348 29L16 23.6995Z" fill="${fill[iconStyle]}"/></svg>`,
        bookmark: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 3H10C8.50714 3 7 4.53333 7 6V28L17 24L26 28V6C26 4.53333 24.4929 3 23 3Z" fill="${fill[iconStyle]}"/></svg>`,
        stars: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.9867 2.66667C8.62667 2.66667 2.66667 8.64 2.66667 16C2.66667 23.36 8.62667 29.3333 15.9867 29.3333C23.36 29.3333 29.3333 23.36 29.3333 16C29.3333 8.64 23.36 2.66667 15.9867 2.66667ZM21.64 24L16 20.6L10.36 24L11.8533 17.5867L6.88 13.28L13.44 12.72L16 6.66667L18.56 12.7067L25.12 13.2667L20.1467 17.5733L21.64 24Z" fill="${fill[iconStyle]}"/></svg>`,
    };


    const offscreen = new OffscreenCanvas(32, 32);
    const ctx = offscreen.getContext('2d');
    const v = await Canvg.fromString(ctx, svg[iconType], presets.offscreen());
    await v.render();
    const blob = await offscreen.convertToBlob();
    const pngUrl = URL.createObjectURL(blob);
	
    chrome.browserAction.setIcon({ path: {
        32: pngUrl
    }});
};

chrome.storage.onChanged.addListener((changes, namepsace) => {
    for (const [key, value] of Object.entries(changes)) {
        storageCache[key] = value.newValue;
    }
    if (changes.iconType || changes.iconStyle || changes.iconStyleAuto) {
        setIcon(storageCache.iconType, storageCache.iconStyle, storageCache.iconStyleAuto, isBrowserDark);
    }
});

chrome.tabs.onUpdated.addListener(() => {
    isBrowserDark = window.matchMedia("(prefers-color-scheme: dark)").matches || chrome.extension.inIncognitoContext;
    setIcon(storageCache.iconType, storageCache.iconStyle, storageCache.iconStyleAuto, isBrowserDark);
});

chrome.runtime.onMessage.addListener(message => {
    isBrowserDark = message.isBrowserDark;
    setIcon(storageCache.iconType, storageCache.iconStyle, storageCache.iconStyleAuto, isBrowserDark);
});