// AI Chat Window functionality
const aiChatButton = document.getElementById('ai-chat-button');
const aiChatWindow = document.getElementById('ai-chat-window');
const closeChatButton = document.getElementById('close-chat-button');
const expandChatButton = document.getElementById('expand-chat-button');
const chatInput = document.getElementById('chat-input');
const sendChatButton = document.getElementById('send-chat-button');
const chatMessagesContainer = document.getElementById('chat-messages');
const interactivePanel = document.getElementById('ai-interactive-panel');
const interactivePanelTitle = document.getElementById('interactive-panel-title');
const interactivePanelContent = document.getElementById('interactive-panel-content');
const closeInteractivePanelButton = document.getElementById('close-interactive-panel-button');
const aiPanelSeparator = document.getElementById('ai-panel-separator');

// Global variable to hold reference to the last generated toggle button
let lastToggleButtonElement = null;

// Function to toggle chat window visibility (open/close)
function toggleChatWindowVisibility() {
    // console.log("toggleChatWindowVisibility called.");
    if (aiChatWindow.classList.contains('chat-window-open')) {
        // console.log("Closing chat window.");
        aiChatWindow.classList.remove('chat-window-open');
        aiChatWindow.classList.remove('is-minimal');
        aiChatWindow.classList.remove('is-fullscreen');
        aiChatWindow.classList.remove('has-interactive-panel');
        toggleInteractivePanel('hide');

        setTimeout(() => {
            if (!aiChatWindow.classList.contains('chat-window-open')) {
                aiChatWindow.style.display = 'none';
            }
        }, 300);

    } else {
        // console.log("Opening chat window.");
        aiChatWindow.style.display = 'flex';
        void aiChatWindow.offsetWidth; 
        aiChatWindow.classList.add('chat-window-open', 'is-minimal');
        chatInput.focus();
        // console.log("Chat window opened to minimal state.");
    }
    updateExpandCollapseButton();
}

// Function to toggle fullscreen mode
function toggleFullscreen() {
    // console.log("toggleFullscreen called.");
    if (aiChatWindow.classList.contains('is-fullscreen')) {
        // console.log("Exiting fullscreen.");
        aiChatWindow.classList.remove('is-fullscreen');
        aiChatWindow.classList.add('is-minimal');
        // console.log("Exited fullscreen, CSS transition back to minimal expected.");
    } else {
        // console.log("Entering fullscreen.");
        aiChatWindow.classList.remove('is-minimal'); 
        aiChatWindow.classList.add('is-fullscreen');
        // console.log("Entered fullscreen, CSS transition to fullscreen expected.");
    }
    chatInput.focus();
    updateExpandCollapseButton();
}

// Update expand/collapse button icon
function updateExpandCollapseButton() {
    if (aiChatWindow.classList.contains('is-fullscreen')) {
        // Show minimize-2 icon
        expandChatButton.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><path d="M14 10 21 3"/><path d="M3 21 10 14"/></svg>`;
    } else {
        // Show maximize-2 icon
        expandChatButton.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><path d="M21 3 14 10"/><path d="M3 21 10 14"/></svg>`;
    }
}

// Function to show/hide the interactive sub-panel
function toggleInteractivePanel(action, componentType = null) {
    // console.log("toggleInteractivePanel called with action:", action, "and componentType:", componentType);
    if (action === 'toggle') {
        action = interactivePanel.classList.contains('is-active') ? 'hide' : 'show';
        if (lastToggleButtonElement && lastToggleButtonElement.dataset.componentType) {
            componentType = lastToggleButtonElement.dataset.componentType;
        } else if (action === 'show') {
            console.warn("Could not determine component type for toggle. Defaulting to chart.");
            componentType = 'chart';
        }
    }

    if (action === 'show') {
        // console.log("Showing interactive panel.");
        interactivePanel.classList.add('is-active');
        aiPanelSeparator.classList.remove('hidden');
        setTimeout(() => aiPanelSeparator.classList.add('is-active'), 50);

        aiChatWindow.classList.add('has-interactive-panel');

        if (componentType === 'chart') {
            interactivePanelContent.innerHTML = `<div class="w-full h-full bg-gray-600 rounded-md flex items-center justify-center"><p class="text-white text-lg">📈 Placeholder Chart Data</p></div>`;
        } else if (componentType === 'map') {
            interactivePanelContent.innerHTML = `<div class="w-full h-full bg-gray-600 rounded-md flex items-center justify-center"><p class="text-white text-lg">🗺️ Placeholder Map Data</p></div>`;
        }

        if (lastToggleButtonElement) {
            lastToggleButtonElement.innerHTML = `<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path d="m17 8-4 4 4 4"/><path d="M13 20V4"/></svg> Hide Component`;
            lastToggleButtonElement.dataset.componentType = componentType;
        }

    } else if (action === 'hide') {
        // console.log("Hiding interactive panel.");
        interactivePanel.classList.remove('is-active');
        aiPanelSeparator.classList.remove('is-active');
        aiPanelSeparator.classList.add('hidden');

        aiChatWindow.classList.remove('has-interactive-panel');
        interactivePanelContent.innerHTML = '<p>Interactive content will appear here.</p>';

        if (lastToggleButtonElement) {
            lastToggleButtonElement.innerHTML = `<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path d="m17 8-4 4 4 4"/><path d="M13 20V4"/></svg> Show Component`;
        }
    }
}


aiChatButton.addEventListener('click', toggleChatWindowVisibility);
closeChatButton.addEventListener('click', toggleChatWindowVisibility);
expandChatButton.addEventListener('click', toggleFullscreen);
closeInteractivePanelButton.addEventListener('click', () => toggleInteractivePanel('hide'));

// Simulate sending/receiving messages
function addChatMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
    messageDiv.innerHTML = `
        <div class="${sender === 'user' ? 'bg-blue-600' : 'bg-gray-600'} text-white p-2 rounded-lg max-w-[80%] break-words">
            ${message}
        </div>
    `;
    chatMessagesContainer.appendChild(messageDiv);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

sendChatButton.addEventListener('click', async () => {
    const message = chatInput.value.trim();
    if (!message) {
        alertMessage("Please enter a message.", "error");
        return;
    }

    addChatMessage(message, 'user');
    chatInput.value = '';
    sendChatButton.disabled = true;

    const isShowChart = message.toLowerCase().includes("show chart");
    const isShowMap = message.toLowerCase().includes("show map");
    const isGenerateResponse = message.toLowerCase().includes("generate response");

    if (isShowChart || isShowMap) {
        const componentType = isShowChart ? 'chart' : 'map';
        toggleInteractivePanel('show', componentType);

        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.className = `flex justify-start`;
        aiMessageDiv.innerHTML = `
            <div class="bg-gray-600 text-white p-2 rounded-lg max-w-[80%] break-words flex flex-col">
                <span>Here's a placeholder ${componentType} for your data!</span>
                <button class="toggle-component-button mt-2 bg-gray-700 hover:bg-slate-700 text-white p-2 rounded-md transition duration-200 text-sm flex items-center justify-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path d="m17 8-4 4 4 4"/><path d="M13 20V4"/></svg> Hide Component
                </button>
            </div>
        `;
        chatMessagesContainer.appendChild(aiMessageDiv);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

        const toggleButton = aiMessageDiv.querySelector('.toggle-component-button');
        if (toggleButton) {
            if (lastToggleButtonElement && lastToggleButtonElement !== toggleButton) {
                lastToggleButtonElement.onclick = null;
            }
            lastToggleButtonElement = toggleButton;
            lastToggleButtonElement.dataset.componentType = componentType;

            lastToggleButtonElement.addEventListener('click', () => {
                toggleInteractivePanel('toggle');
            });
        }

    } else if (isGenerateResponse) {
        addChatMessage("Generating response...", 'ai');
        const prompt = "Please provide a concise summary of current global economic trends, including key indicators and potential future outlook.";
        try {
            const chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });
            const payload = { contents: chatHistory };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
            }

            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                addChatMessage(text, 'ai');
            } else {
                addChatMessage("Sorry, I could not generate a response.", 'ai');
                console.error("Gemini API response structure unexpected:", result);
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            addChatMessage(`Error generating response: ${error.message}`, 'ai');
        }
        toggleInteractivePanel('hide');
        lastToggleButtonElement = null;
    }
    else {
        // Default AI response for other messages
        setTimeout(() => {
            addChatMessage("I'm Lumen. In a real app, I would process your request and provide insights. How else can I assist? Try typing 'show chart', 'show map', or 'generate response'!", 'ai');
        }, 800);
        toggleInteractivePanel('hide');
        lastToggleButtonElement = null;
    }
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatButton.click();
    }
});

// Event listener to enable/disable send button based on input content
chatInput.addEventListener('input', () => {
    sendChatButton.disabled = chatInput.value.trim() === '';
});