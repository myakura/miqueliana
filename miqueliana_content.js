console.log("hello");

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
	const whatToShow = Node.ELEMENT_NODE + Node.TEXT_NODE;
	const treeWalker = document.createTreeWalker(fragment, whatToShow);
	return treeWalker;
}

function walkTree(treeWalker) {
	if (!treeWalker) {
		return null;
	}
	let currentNode = treeWalker.firstChild();
	while (currentNode) {
		console.log(currentNode);
		currentNode = treeWalker.nextNode();
	}
}

function handleMessage(message) {
	console.log(message);

	const fragment = getSelectionFragment();
	console.log(fragment);

	const treeWalker = createFragmentWalker(fragment);
	walkTree(treeWalker);
}

chrome.runtime.onMessage.addListener(handleMessage);
