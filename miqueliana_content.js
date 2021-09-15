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
	return node?.nodeType === Node.ELEMENT_NODE;
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

function handleParagraph(currentNode) {
	let md = `\n\n`;
	const parent = currentNode.parentElement;
	// fixme: probably not the case for all elements
	if (isElement(parent) && currentNode === parent.firstElementChild) {
		md = ``;
	}
	return { md };
}

function handleHeadings(currentNode) {
	const level = Number.parseInt(elementName(currentNode).slice(1));
	const md = `\n\n${"#".repeat(level)} `;
	return { md };
}

function handleList(currentNode) {
	const md = `\n`;
	return { md };
}

function handleListItem(currentNode) {
	let md = `\n* `;
	const parent = currentNode.parentElement;
	if (parent === null) {
		md = `\n* `;
	}
	if (isElementType(parent, `ul`)) {
		md = `\n* `;
	}
	if (isElementType(parent, `ol`)) {
		const items = [...parent.children];
		const i = items.findIndex(item => item === currentNode) + 1;
		// note: should the number space-padded?
		md = `\n${i}. `;
	}
	return { md };
}

function walkTree(treeWalker) {
	if (!treeWalker) {
		return null;
	}
	let markdown = ``;
	let currentNode = treeWalker.firstChild();
	while (currentNode) {
		console.log(currentNode);
		switch(elementName(currentNode)) {
			case `p`: {
				const { md } = handleParagraph(currentNode);
				markdown += md;
				break;
			}
			case `h1`:
			case `h2`:
			case `h3`:
			case `h4`:
			case `h5`:
			case `h6`: {
				const { md } = handleHeadings(currentNode);
				markdown += md;
				break;
			}
			case `ul`:
			case `ol`: {
				const { md } = handleList(currentNode);
				markdown += md;
				break;
			}
			case `li`: {
				const { md } = handleListItem(currentNode);
				markdown += md;
				break;
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
