function getSelectionFragment() {
	const selection = window.getSelection();
	if (selection.type !== `Range`) {
		return null;
	}
	const range = selection.getRangeAt(0);
	return range.cloneContents();
}

function createFragmentWalker(fragment) {
	if (!fragment) {
		return null;
	}
	const whatToShow = NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_TEXT;
	const treeWalker = document.createTreeWalker(fragment, whatToShow);
	return treeWalker;
}

function walkTree(treeWalker) {
	if (!treeWalker) {
		return null;
	}
	let markdown = ``;
	let currentNode = treeWalker.firstChild();
	while (currentNode) {
		console.log(currentNode);
		if (currentNode.nodeType === Node.ELEMENT_NODE && currentNode.tagname === `P`) {
			markdown += `\n`;
		}
		if (currentNode.nodeType === Node.TEXT_NODE) {
			if (!/^\s+$/.test(currentNode)) {
				markdown += currentNode.nodeValue;
			}
		}
		currentNode = treeWalker.nextNode();
	}
	console.log(markdown);
}

function handleMessage(message) {
	console.log(message);

	const fragment = getSelectionFragment();
	console.log(fragment);

	const treeWalker = createFragmentWalker(fragment);
	walkTree(treeWalker);
}

chrome.runtime.onMessage.addListener(handleMessage);
