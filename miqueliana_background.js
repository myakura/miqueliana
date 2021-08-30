console.log("hello");

function handleActionClick() {
	console.log("action clicked.");

	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		console.log(tabs);
		chrome.tabs.sendMessage(tabs[0].id, { message: "hello from bakground script." })
	})
}

chrome.browserAction.onClicked.addListener(handleActionClick);
