$(document).ready(function() {
    const $messageInput = $('#messageInput');
    const $sendButton = $('#sendButton');
    const $chatMessages = $('#chatMessages');
    const $typingIndicator = $('#typingIndicator');

    // Configure marked.js options
    marked.setOptions({
        breaks: true,           // Add line breaks on single line breaks
        gfm: true,              // Use GitHub Flavored Markdown
        headerIds: false,       // Don't add IDs to headers (for simplicity)
        mangle: false,          // Don't mangle email addresses
        sanitize: false,        // Let the browser handle HTML sanitization
        smartLists: true,       // Use smarter list behavior than default markdown
        smartypants: true,      // Use "smart" typographic punctuation
        xhtml: false            // Don't use self-closing tags for HTML
    });
    
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
                            ${marked.parse(content)}
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
        // Append the typing indicator to the end of the chat container, ensuring it appears where the next bot message will be added.
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
    
    // Initialises Assistant and Thread objects for chat session 
    let chatInit = $.ajax({
        url: "init_chat",
        type: "GET",
        success: function(response) {
            console.log("Chat initialized:", response);
        },
        error: function(xhr, status, error) {
            console.error("Error initializing chat:", error);
        }
    });

    async function sendMessage() {
        const message = $messageInput.val().trim();
        if (!message) return;
    
        // Add user message to chat UI
        addMessage(message, true);
    
        // Clear input field
        $messageInput.val('');

        showTypingIndicator();

        // Wait for chatbot to finish initialising before calling backend
        await chatInit;

        try {
            // Send only the latest user message to backend
            const response = await fetch('get_model_response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })  // Sending only the latest message
            });
    
            const data = await response.json();
    
            // Hide typing indicator and add bot response
            hideTypingIndicator();
            addMessage(data.response); // Display bot response
        } catch (error) {
            hideTypingIndicator();
            addMessage("Sorry, I'm having trouble responding right now.");
            console.error("Error:", error);
        }
    }
    
    $sendButton.on('click', sendMessage);

    $messageInput.on('keypress', function(e) {
        if (e.keyCode === 13) {  // Enter key
            sendMessage();
        }
    });
    
    // Focus input on page load
    $messageInput.focus();
});