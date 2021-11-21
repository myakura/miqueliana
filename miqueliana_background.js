function flashBadge({ success = true }) {
	// credit: https://github.com/chitsaou/copy-as-markdown
	const text = success ? `✔` : `✘`;
	const color = success ? `hsl(135, 70%, 30%)` : `hsl(0, 80%, 40%)`;
	const emptyText = ``;
	const transparent = `#000f`;
	const timeout = 1000;

	chrome.browserAction.setBadgeText({ text: text });
	chrome.browserAction.setBadgeBackgroundColor({ color: color });

	setTimeout(() => {
		chrome.browserAction.setBadgeText({ text: emptyText });
		chrome.browserAction.setBadgeBackgroundColor({ color: transparent });
	}, timeout);
}

function copyText(text) {
	if (!text) {
		return;
	}
	const textarea = document.createElement(`textarea`);
	document.body.append(textarea);

	textarea.value = text;
	textarea.select();

	const success = document.execCommand(`copy`);
	if (success) {
		console.log(`copy success.`);
		console.log(text);
	} else {
		console.log(`copy failed.`);
	}

	textarea.remove();
}

function getCurrentTab() {
	return new Promise((resolve, reject) => {
		chrome.tabs.query({ currentWindow: true, highlighted: true }, (tabs) => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			}
			resolve(tabs[0]);
		});
	});
}

function sendMessage(tabId, message) {
	return new Promise((resolve, reject) => {
		chrome.tabs.sendMessage(tabId, message, null, (response) => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			}
			resolve(response);
		});
	});
}

async function executeCommand(commandName) {
	try {
		const tab = await getCurrentTab();
		const response = await sendMessage(tab.id, { message: commandName });
		console.log(response);
		copyText(response.markdown);
		flashBadge({ success: true });
	}
	catch (error) {
		console.error(error);
		flashBadge({ success: false });
	}
}

chrome.browserAction.onClicked.addListener(async () => {
	await executeCommand(`copy-markdown`);
});

chrome.commands.onCommand.addListener(async (commandName) => {
	await executeCommand(commandName);
});
