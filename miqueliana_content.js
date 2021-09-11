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

function isElement(node) {
	return node.nodeType === Node.ELEMENT_NODE;
}

function elementName(node) {
	return node?.tagName?.toLowerCase();
}

function isElementType(node, name) {
	return isElement(node) && elementName(node) === name;
}

function isElementTypeOneOf(node, names) {
	return isElement(node) && names.includes(elementName(node));
}

function isText(node) {
	return node.nodeType === Node.TEXT_NODE;
}

function isEmptyText(node) {
	return isText(node) && /^\s+$/.test(node.nodeValue);
}

function walkTree(treeWalker) {
	if (!treeWalker) {
		return null;
	}
	let markdown = ``;
	let currentNode = treeWalker.firstChild();
	while (currentNode) {
		console.log(currentNode);
		if (isElement(currentNode)) {
			if (isElementType(currentNode, `p`)) {
				markdown += `\n\n`;
			}
			if (isElementTypeOneOf(currentNode, [`h1`, `h2`, `h3`, `h4`, `h5`, `h6`])) {
				const level = Number.parseInt(elementName(currentNode).slice(1));
				markdown += `\n\n${"#".repeat(level)} `;
			}
			if (isElementTypeOneOf(currentNode, [`ul`, `ol`])) {
				markdown += `\n`;
			}
			if (isElementType(currentNode, `li`)) {
				const parent = currentNode.parentElement;
				if (isElementType(parent, `ul`)) {
					markdown += `\n* `;
				}
				else if (isElementType(parent, `ol`)) {
					markdown += `\n1. `
				}
			}
		}
		if (isText(currentNode)) {
			if (!isEmptyText(currentNode)) {
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
