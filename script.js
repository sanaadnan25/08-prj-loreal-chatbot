// DOM elements
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// System prompt for OpenAI API
const SYSTEM_PROMPT =
  "You are a helpful assistant for L’Oréal. Only answer questions related to L’Oréal products, beauty routines, recommendations, or beauty-related topics. If asked anything unrelated, politely reply: 'Sorry, I can only help with L’Oréal products, routines, recommendations, and beauty-related topics.' If the user provides their name, remember it and use it in future responses.";

// Store chat history
let messages = [
  { role: "system", content: SYSTEM_PROMPT },
  { role: "assistant", content: "👋 Hello! How can I help you today?" },
];

let userName = "";

// Show initial messages
renderMessages();

// Render all messages
function renderMessages() {
  chatWindow.innerHTML = "";

  const visibleMessages = messages.filter((m) => m.role !== "system");

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

  const userText = userInput.value.trim();
  if (!userText) return;
  userInput.value = "";

  // Detect user name
  if (!userName) {
    const nameMatch = userText.match(/(?:my name is|i'm|i am)\s+([a-zA-Z]+)\b/i);
    if (nameMatch) {
      userName = nameMatch[1];
    }
  }

  messages.push({ role: "user", content: userText });
  messages.push({ role: "assistant", content: "…" });
  renderMessages();

  try {
    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.filter((m, i) =>
        m.role !== "system" &&
        m.content !== "…" &&
        !(m.role === "assistant" && m.content === "👋 Hello! How can I help you today?" && i === 1)
      ),
    ];

    if (userName) {
      apiMessages.push({
        role: "system",
        content: `The user's name is ${userName}. Use their name in your responses when appropriate.`,
      });
    }

    const response = await fetch("https://glascony.adnans-2e2.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: apiMessages }),
    });

    const data = await response.json();

    messages.pop(); // remove "…"

    const aiReply =
      data.choices?.[0]?.message?.content ||
      "Sorry, I couldn't get a response. Please try again.";

    messages.push({ role: "assistant", content: aiReply });
    renderMessages();
  } catch (err) {
    messages.pop();
    messages.push({
      role: "assistant",
      content: "Sorry, there was a problem connecting to the chatbot.",
    });
    renderMessages();
  }
});
