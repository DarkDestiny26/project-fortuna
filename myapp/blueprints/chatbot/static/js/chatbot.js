$(document).ready(function() {
    const $messageInput = $('#messageInput');
    const $sendButton = $('#sendButton');
    const $chatMessages = $('#chatMessages');
    const $typingIndicator = $('#typingIndicator');
    
    // Function to add a new message to the chat
    function addMessage(content, isUser = false) {
        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        
        let $messageElement;
        
        if (isUser) {
            $messageElement = $(`
                <div class="message-wrapper" style="justify-content: flex-end;">
                    <div>
                        <div class="message message-user">
                            ${content}
                            <div class="message-time">${timeString}</div>
                        </div>
                    </div>
                </div>
            `);
        } else {
            $messageElement = $(`
                <div class="message-wrapper">
                    <div class="message-avatar d-flex align-items-center justify-content-center bg-primary text-white">
                        <i class="bi bi-robot"></i>
                    </div>
                    <div>
                        <div class="bot-info">
                            <span class="bot-name">Fortuna</span>
                        </div>
                        <div class="message message-bot">
                            ${content}
                            <div class="message-time">${timeString}</div>
                        </div>
                    </div>
                </div>
            `);
        }
        
        // Append to chat messages
        $chatMessages.append($messageElement);
        
        // Scroll to bottom
        scrollToBottom();
    }
    
    // Function to show typing indicator
    function showTypingIndicator() {
        // Append the typing indicator to the end of the chat container,
        // ensuring it appears where the next bot message will be added.
        $chatMessages.append($typingIndicator);
        $typingIndicator.css('display', 'flex');
        scrollToBottom();
    }
    
    // Function to hide typing indicator
    function hideTypingIndicator() {
        $typingIndicator.hide();
    }
    
    // Helper function to scroll to the bottom of the chat
    function scrollToBottom() {
        // We need to scroll the entire chat area including the typing indicator
        setTimeout(() => {
            const scrollHeight = $chatMessages[0].scrollHeight + $typingIndicator.outerHeight(true);
            $chatMessages.scrollTop(scrollHeight);
        }, 100); // Small timeout to ensure DOM is updated
    }
    
    // Mock response function (replace with actual API call)
    function getBotResponse(message) {
        return new Promise((resolve) => {
            // Simulate network delay
            setTimeout(() => {
                const responses = [
                    "I can help you analyze your current portfolio performance.",
                    "Based on your risk profile, I recommend diversifying into more ETFs.",
                    "Your investment goal of retirement in 15 years suggests a moderate growth strategy.",
                    "The market has been volatile lately. Would you like me to suggest some defensive positions?",
                    "I've analyzed your holdings and noticed your tech allocation is above your target range."
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                resolve(randomResponse);
            }, 1500);
        });
    }
    
    // Send message function
    async function sendMessage() {
        const message = $messageInput.val().trim();
        if (!message) return;
        
        // Add user message
        addMessage(message, true);
        
        // Clear input
        $messageInput.val('');
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            // Get bot response
            const response = await getBotResponse(message);
            
            // Hide typing indicator and add bot response
            hideTypingIndicator();
            addMessage(response);
        } catch (error) {
            // Hide typing indicator and show error
            hideTypingIndicator();
            addMessage("Sorry, I'm having trouble responding right now. Please try again later.");
            console.error("Error getting response:", error);
        }
    }
    
    // Event listeners
    $sendButton.on('click', sendMessage);
    
    $messageInput.on('keypress', function(e) {
        if (e.keyCode === 13) {  // Enter key
            sendMessage();
        }
    });
    
    // Focus input on page load
    $messageInput.focus();
});