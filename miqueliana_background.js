console.log("hello");

function flashBadge({ success = true }) {
	// credit: https://github.com/chitsaou/copy-as-markdown
	const text = success ? `✔` : `✘`;
	const color = success ? `hsl(135deg 70% 30%)` : `hsl(0deg 80% 40%)`;
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

async function sendCommand(commandName) {
	try {
		const tab = await getCurrentTab();
		chrome.tabs.sendMessage(tab.id, { message: commandName });
	} catch (error) {
		console.error(error);
		flashBadge({ success: false });
	}
}

chrome.browserAction.onClicked.addListener(async () => {
	await sendCommand(`say-hello`);
});
