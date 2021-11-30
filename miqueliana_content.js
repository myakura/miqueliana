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

function getElementName(node) {
	return node?.tagName?.toLowerCase();
}

function isElementType(node, name) {
	return isElement(node) && getElementName(node) === name;
}

function isElementTypeOneOf(node, names) {
	return isElement(node) && names.includes(getElementName(node));
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
	const level = Number.parseInt(getElementName(currentNode).slice(1));
	const md = `\n\n${"#".repeat(level)} `;
	return { md };
}

function handleList(currentNode) {
	const parent = currentNode.parentElement;
	const listLeading = isElementType(parent, `li`) ? `` : `\n`;
	const md = listLeading;
	return { md };
}

function handleDt(currentNode) {
	const md = (currentNode.previousSibling?.tagName === `DD`) ? `\n\n` : `\n`;
	return { md };
}

function handleDd(currentNode) {
	const md = `\n`;
	return { md };
}

function handleHr(currentNode) {
	const md = `\n\n***\n`;
	return { md };
}

function handleBr(currentNode) {
	const md = `  \n`;
	return { md };
}

function handleListItem(currentNode) {
	const nestLevel = getNestLevel(currentNode, [`ul`, `ol`]);
	console.log(`nestlevel`, nestLevel);
	let indentLevel = (nestLevel > 0) ? nestLevel - 1 : 0;
	let indentChars = `  `;
	let marker = `*`;

	const parent = currentNode.parentElement;
	if (isElementType(parent, `ol`)) {
		const items = [...parent.children];
		const number = items.findIndex(item => item === currentNode) + 1;
		indentChars = `    `;
		marker = `${number}.`;
	}

	const indent = indentChars.repeat(indentLevel);
	const md = `\n${indent}${marker} `;
	return { md };
}

function handlePre(currentNode) {
	const content = currentNode.innerText;

	let lang = ``;
	const childCode = currentNode.querySelector(`:scope > code[class*="language-"]`);
	if (!!childCode) {
		lang = /language-(\S+)/.exec(childCode.className)[1];
	}

	const md = '\n\n```' + lang + '\n' + content.trim() + '\n```';
	const next = `nextSibling`;
	return { md, next };
}

function handleCode(currentNode) {
	const content = currentNode.innerText;
	const md = '`' + escapeBacktick(content) + '`';
	const next = `nextSibling`;
	return { md, next };
}

function handleStrong(currentNode) {
	const content = currentNode.innerText;
	const md = `**${content.replaceAll(`**`, `\*\*`)}**`;
	const next = `nextSibling`;
	return { md, next };
}

function handleEm(currentNode) {
	const content = currentNode.innerText;
	const md = `_${content.replaceAll(`_`, `\_`)}_`;
	const next = `nextSibling`;
	return { md, next };
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
	return !!node.parentElement?.closest(name);
}

function insidePre(currentNode) {
	return insideElementType(currentNode, `pre`);
}

function stripLeadingWhitespace(string) {
	return string.trimStart();
}

function stripTrailingWhitespace(string) {
	return string.replaceAll(/(?<=\S) $/g, ``);
}

function coalesceLinebreakAndWhitespace(string) {
	return string.replaceAll(/\s+(?!  \n)/g, ` `);
}

function escapeBacktick(string) {
	return string.replaceAll('`', '\`');
}

function escapeOpenSquareBracket(string) {
	return string.replaceAll('[', '\[');
}

function handleText(currentNode) {
	const parent = currentNode.parent;
	let md = ``;
	if (!isEmptyText(currentNode)) {
		let text = currentNode.nodeValue;
		text = coalesceLinebreakAndWhitespace(text);
		text = escapeBacktick(text);
		text = escapeOpenSquareBracket(text);

		if (currentNode === parent?.firstChild) {
			text = stripLeadingWhitespace(text);
		}
		if (currentNode === parent?.lastChild) {
			text = stripTrailingWhitespace(text);
		}
		md = text;
	}
	return { md };
}

function cleanupEmptyContentLines(text) {
	return text
		.replaceAll(/^#+\s+\n/g, ``)
		.replaceAll(/^\*\s+\n/g, ``)
		.replaceAll(/^\d+\.\s+\n/g, ``);
}

function createMarkdown(treeWalker) {
	if (!treeWalker) {
		return ``;
	}
	let markdown = ``;
	let currentNode = treeWalker.firstChild();
	let nextMethod = `nextNode`;
	while (currentNode) {
		switch (getElementName(currentNode)) {
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
			case `dt`: {
				const { md } = handleDt(currentNode);
				markdown += md;
				break;
			}
			case `dd`: {
				const { md } = handleDd(currentNode);
				markdown += md;
				break;
			}
			case `li`: {
				const { md } = handleListItem(currentNode);
				markdown += md;
				break;
			}
			case `hr`: {
				const { md } = handleHr(currentNode);
				markdown += md;
				break;
			}
			case `br`: {
				const { md } = handleBr(currentNode);
				markdown += md;
				break;
			}
			case `pre`: {
				const { md, next } = handlePre(currentNode);
				markdown += md;
				nextMethod = next;
				break;
			}
			case `code`: {
				const { md, next } = handleCode(currentNode);
				markdown += md;
				nextMethod = next;
				break;
			}
			case `strong`: {
				const { md, next } = handleStrong(currentNode);
				markdown += md;
				nextMethod = next;
				break;
			}
			case `em`: {
				const { md, next } = handleEm(currentNode);
				markdown += md;
				nextMethod = next;
				break;
			}
		}
		if (isText(currentNode)) {
			const { md } = handleText(currentNode);
			markdown += md;
		}
		console.group(`currentNode:`, currentNode);
		console.log(`markdown:`, markdown);
		console.log(`nextMethod:`, `treeWalker.${nextMethod}()`);
		console.groupEnd();
		currentNode = treeWalker[nextMethod]();
		nextMethod = `nextNode`;
	}
	markdown = cleanupEmptyContentLines(markdown);
	return markdown;
}

function handleMessage(message, sender, sendResponse) {
	console.log(`message:`, message);

	const fragment = getSelectionFragment();
	console.log(`fragment:`, fragment);

	const treeWalker = createFragmentWalker(fragment);
	const markdown = createMarkdown(treeWalker);
	console.log(`markdown:`, markdown);

	sendResponse({ markdown: markdown.trim() });
	return true;
}

chrome.runtime.onMessage.addListener(handleMessage);
