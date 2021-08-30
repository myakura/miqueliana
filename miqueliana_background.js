console.log("hello");

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
	}
}

chrome.browserAction.onClicked.addListener(async () => {
	await sendCommand(`say-hello`);
});
