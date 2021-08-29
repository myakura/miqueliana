console.log("hello");

function handleActionClick() {
	console.log("action clicked.");
}

chrome.browserAction.onClicked.addListener(handleActionClick);
