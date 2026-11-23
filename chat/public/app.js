const form = document.getElementById("chat-form");
const input = document.getElementById("input");
const sendButton = document.getElementById("send");
const messagesEl = document.getElementById("messages");
const history = [];

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg msg-${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  div.appendChild(bubble);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  sendButton.disabled = true;
  addMessage("user", text);
  const typing = addMessage("assistant", "Escribiendo…");
  history.push({ role: "user", content: text });
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error desconocido del servidor");
    const reply = typeof data.reply === "string" ? data.reply : "";
    typing.textContent = reply || "(respuesta vacía)";
    history.push({ role: "assistant", content: reply });
  } catch (err) {
    history.pop();
    typing.textContent = `Error: ${err.message}`;
    typing.classList.add("error");
  } finally {
    sendButton.disabled = false;
    input.focus();
  }
});
