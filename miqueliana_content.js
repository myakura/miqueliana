console.log("hello");

function getSelectionFragment() {
	// TODO: handle empty selections
	const selection = window.getSelection();
	const range = selection.getRangeAt(0);
	return range.cloneContents();
}

function handleMessage(message) {
	console.log(message);

	const fragment = getSelectionFragment();
	console.log(fragment);
}

chrome.runtime.onMessage.addListener(handleMessage);
