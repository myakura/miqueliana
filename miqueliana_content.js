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
	const nestLevel = getNestLevel(currentNode, [`ul`, `ol`]);
	const indent = `  `.repeat(nestLevel - 1);
	let marker = `*`;

	const parent = currentNode.parentElement;
	if (isElementType(parent, `ol`)) {
		const items = [...parent.children];
		const number = items.findIndex(item => item === currentNode) + 1;
		// note: should the number zero-padded?
		marker = `${number}.`;
	}

	const md = `\n${indent}${marker} `;
	return { md };
}

function getNestLevel(currentNode, boundaryElements) {
	let level = 0;
	let boundary = currentNode?.closest(boundaryElements.join(`, `));
	while (boundary) {
		level++;
		boundary = boundary?.parentElement?.closest(boundaryElements.join(`, `));
	}
	return level;
}

function insideElementType(node, name) {
	return !!node.parentElement?.closest(name)
}

function insidePre(currentNode) {
	return insideElementType(currentNode, `pre`);
}

function stripWhitespace(string) {
	return string.replaceAll(/\s+/g, ` `).trim();
}

function handleText(currentNode) {
	let md = ``;
	if (insidePre(currentNode)) {
		md = currentNode.nodeValue;
	}
	else if (isEmptyText(currentNode)) {
		// do nothing
	}
	else {
		let text = currentNode.nodeValue;
		md = stripWhitespace(text);
	}
	return { md }
}

function createMarkdown(treeWalker) {
	if (!treeWalker) {
		return ``;
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
			const { md } = handleText(currentNode);
			markdown += md;
		}
		currentNode = treeWalker.nextNode();
	}
	return markdown;
}

function handleMessage(message, sender, sendResponse) {
	console.log(message);

	const fragment = getSelectionFragment();
	console.log(fragment);

	const treeWalker = createFragmentWalker(fragment);
	const markdown = createMarkdown(treeWalker);
	console.log(markdown);

	sendResponse({ markdown: markdown.trim() })
	return true;
}

chrome.runtime.onMessage.addListener(handleMessage);
