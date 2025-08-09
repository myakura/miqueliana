function getSelectionFragment() {
	const selection = window.getSelection();
	if (selection.type !== 'Range') {
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

function getNestLevel(currentNode, boundaryElements) {
	let level = 0;
	let boundary = currentNode?.closest(boundaryElements.join(', '));
	while (boundary) {
		level++;
		boundary = boundary?.parentElement?.closest(boundaryElements.join(', '));
	}
	return level;
}

function insideElementType(node, name) {
	return !!node.parentElement?.closest(name);
}

function insidePre(currentNode) {
	return insideElementType(currentNode, 'pre');
}

function coalesceLinebreakAndWhitespace(string) {
	return string.replaceAll(/\s+(?!  \n)/g, ' ');
}

function escapeBacktick(string) {
	return string.replaceAll('`', '\\`');
}

function escapeOpenSquareBracket(string) {
	return string.replaceAll('[', '\\[');
}

function nodeToString(node) {
	if (isEmptyText(node)) {
		return '';
	}
	if (isText(node)) {
		let text = node.nodeValue;
		text = coalesceLinebreakAndWhitespace(text);
		text = escapeBacktick(text);
		text = escapeOpenSquareBracket(text);
		return text;
	}

	if (!isElement(node)) {
		return '';
	}

	const parent = node.parentElement;
	const elementName = getElementName(node);

	let children = '';
	if (node.hasChildNodes()) {
		for (const child of node.childNodes) {
			children += nodeToString(child);
		}
	}

	switch (elementName) {
		case 'p': {
			return `\n\n${children}`;
		}
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'h5':
		case 'h6': {
			const level = Number.parseInt(elementName.slice(1));
			return `\n\n${'#'.repeat(level)} ${children}`;
		}
		case 'ul':
		case 'ol': {
			const listLeading = isElementType(parent, 'li') ? '\n' : '\n\n';
			return `${listLeading}${children.trim()}\n`;
		}
		case 'li': {
			const nestLevel = getNestLevel(node, ['ul', 'ol']);
			let indentLevel = (nestLevel > 0) ? nestLevel - 1 : 0;
			let indentChars = '  ';
			let marker = '*';

			if (isElementType(parent, 'ol')) {
				const items = [...parent.children].filter(item => getElementName(item) === 'li');
				const number = items.findIndex(item => item === node) + 1;
				indentChars = '    ';
				marker = `${number}.`;
			}

			const indent = indentChars.repeat(indentLevel);
			return `\n${indent}${marker} ${children.trim()}`;
		}
		case 'hr': {
			return '\n\n***\n';
		}
		case 'br': {
			return '  \n';
		}
		case 'pre': {
			let lang = '';
			const childCode = node.querySelector(':scope > code[class*="language-"]');
			if (childCode) {
				lang = /language-(\\S+)/.exec(childCode.className)[1] || '';
			}
			return `\n\n\`\`\`${lang}\n${node.innerText.trim()}\n\`\`\`\n\n`;
		}
		case 'code': {
			if (insidePre(node)) {
				return children;
			}
			return `\`${children}\``;
		}
		case 'strong':
		case 'b': {
			return `**${children}**`;
		}
		case 'em':
		case 'i': {
			return `_${children}_`;
		}
		// case 'a': {
		// 	const href = node.getAttribute('href');
		// 	return `[${children}](${href})`;
		// }
		case 'img': {
			const src = node.getAttribute('src');
			const alt = node.getAttribute('alt') || '';
			return `![${alt}](${src})`;
		}
		case 'blockquote': {
			const lines = children.trim().split('\n');
			return `\n\n${lines.map(line => `> ${line}`).join('\n')}\n\n`;
		}
		default: {
			return children;
		}
	}
}

function createMarkdown(fragment) {
	if (!fragment) {
		return '';
	}
	let markdown = '';
	if (fragment.hasChildNodes()) {
		for (const child of fragment.childNodes) {
			markdown += nodeToString(child);
		}
	}
	// Final cleanup
	markdown = markdown.replace(/^\s+|\s+$/g, '');
	markdown = markdown.replace(/\n{3,}/g, '\n\n');
	return markdown;
}


function handleMessage(message, sender, sendResponse) {
	console.log(`message:`, message);

	const fragment = getSelectionFragment();
	console.log(`fragment:`, fragment);

	const markdown = createMarkdown(fragment);
	console.log(`markdown:`, markdown);

	sendResponse({ markdown: markdown.trim() });
	return true;
}

chrome.runtime.onMessage.addListener(handleMessage);
