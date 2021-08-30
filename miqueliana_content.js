console.log("hello");

function handleMessage(message) {
	console.log(message);
}

chrome.runtime.onMessage.addListener(handleMessage);
