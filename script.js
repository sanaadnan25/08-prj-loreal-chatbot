/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// System prompt for OpenAI API: guides the chatbot to only answer L'Oréal-related questions
const SYSTEM_PROMPT =
  "You are a helpful assistant for L’Oréal. Only answer questions related to L’Oréal products, beauty routines, recommendations, or beauty-related topics. If asked anything unrelated, politely reply: 'Sorry, I can only help with L’Oréal products, routines, recommendations, and beauty-related topics.' If the user provides their name, remember it and use it in future responses.";

// Store chat history as an array of messages
let messages = [{ role: "system", content: SYSTEM_PROMPT }];

// Variable to store user's name if provided
let userName = "";

// Show initial message
renderMessages();

// Create or select the area for the latest question or start message
let latestQuestionDiv = document.createElement("div");
latestQuestionDiv.id = "latest-question";
latestQuestionDiv.style.fontWeight = "600";
latestQuestionDiv.style.fontSize = "1.1rem";
latestQuestionDiv.style.margin = "18px 0 8px 0";
latestQuestionDiv.style.color = "#C6A76D";
latestQuestionDiv.style.textAlign = "left";
const chatboxSection = document.querySelector(".chatbox");
if (chatboxSection && !document.getElementById("latest-question")) {
  chatboxSection.insertBefore(
    latestQuestionDiv,
    chatboxSection.firstChild.nextSibling
  );
}

/**
 * Renders all messages in the chat window.
 * Shows a start message before the first user question.
 * The latest user question is shown above the AI response.
 */
function renderMessages() {
  // Clear chat window
  chatWindow.innerHTML = "";

  // Only show messages with role 'user' or 'assistant' (skip 'system')
  const visibleMessages = messages.filter((m) => m.role !== "system");

  // Find the latest user question (last user message)
  const lastUserMsg = [...visibleMessages]
    .reverse()
    .find((m) => m.role === "user");

  // Show start message before first user question, then show latest question
  if (latestQuestionDiv) {
    if (!lastUserMsg) {
      latestQuestionDiv.textContent = "👋 Hello! How can I help you today?";
      latestQuestionDiv.style.display = "block";
    } else {
      latestQuestionDiv.textContent = lastUserMsg.content;
      latestQuestionDiv.style.display = "block";
    }
  }

  // Render all bubbles (no initial assistant bubble)
  visibleMessages.forEach((msg, idx) => {
    const total = visibleMessages.length;
    const scale = Math.max(0.7, 1 - (total - idx - 1) * 0.08);
    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${msg.role === "assistant" ? "ai" : "user"}`;
    msgDiv.textContent = msg.content;
    msgDiv.style.transform = `scale(${scale})`;
    msgDiv.style.opacity = scale;
    msgDiv.style.transition = "transform 0.3s, opacity 0.3s";
    msgDiv.style.marginBottom = `${14 * scale}px`;
    chatWindow.appendChild(msgDiv);
  });
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Handle form submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user input and clear the field
  const userText = userInput.value.trim();
  if (!userText) return;
  userInput.value = "";

  // Check if user is providing their name (simple detection)
  if (!userName) {
    // Look for patterns like "My name is ..." or "I'm ..."
    const nameMatch = userText.match(
      /(?:my name is|i'm|i am)\s+([a-zA-Z]+)\b/i
    );
    if (nameMatch) {
      userName = nameMatch[1];
    }
  }

  // Add user's message to history
  messages.push({ role: "user", content: userText });

  // Show loading bubble
  messages.push({ role: "assistant", content: "…" });
  renderMessages();

  try {
    // Get API key from secrets.js
    const apiKey = typeof OPENAI_API_KEY !== "undefined" ? OPENAI_API_KEY : "";

    // Prepare messages for API (system prompt first, then conversation)
    // Remove loading bubbles ("…") from API messages
    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.filter((m) => m.role !== "system" && m.content !== "…"),
    ];

    // If we know the user's name, add a note for the assistant
    if (userName) {
      apiMessages.push({
        role: "system",
        content: `The user's name is ${userName}. Use their name in your responses when appropriate.`,
      });
    }

    // Create request body for OpenAI API
    const body = {
      model: "gpt-4o",
      messages: apiMessages,
      max_tokens: 200, // Limit response length
    };

    // Make API call using fetch and async/await
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    // Parse response
    const data = await response.json();

    // Remove loading bubble
    messages.pop();

    // Get chatbot reply and add to history
    const aiReply =
      data.choices && data.choices[0] && data.choices[0].message.content
        ? data.choices[0].message.content
        : "Sorry, I couldn't get a response. Please try again.";

    messages.push({ role: "assistant", content: aiReply });
    renderMessages();
  } catch (err) {
    // Remove loading bubble
    messages.pop();
    messages.push({
      role: "assistant",
      content: "Sorry, there was a problem connecting to the chatbot.",
    });
    renderMessages();
  }
});
