const SYSTEM_PROMPT = `You are an Emergency Assistant for India Emergency Hub.
- Give calm, clear, step-by-step first aid and emergency guidance
- Provide Indian emergency numbers: 112 (national), 102 (ambulance), 101 (fire), 100 (police)
- Help users decide if they need to call an ambulance or go to hospital
- Give first aid for: heart attack, stroke, burns, fractures, choking, bleeding, seizures
- Keep answers SHORT and use numbered steps
- Always end serious situations with: "Call 112 or 102 immediately"
- Never give medication dosage advice`;

let conversationHistory = [];
let isLoading = false;

function toggleChat() {
  document.getElementById('chat-widget').classList.toggle('hidden');
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function addMessage(role, text) {
  const el = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `msg ${role === 'user' ? 'user' : 'bot'}`;
  div.innerHTML = `<div class="bubble">${text.replace(/\n/g, '<br>')}</div>
                   <div class="msg-time">${getTime()}</div>`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function showTyping() {
  const el = document.getElementById('chatMessages');
  el.insertAdjacentHTML('beforeend',
    `<div class="msg bot" id="typingDot">
       <div class="bubble typing"><span></span><span></span><span></span></div>
     </div>`);
  el.scrollTop = el.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typingDot');
  if (t) t.remove();
}

function sendChip(el) {
  document.getElementById('chatInput').value = el.textContent;
  sendMessage();
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || isLoading) return;

  isLoading = true;
  document.getElementById('sendBtn').disabled = true;
  input.value = '';
  input.style.height = 'auto';

  addMessage('user', text);
  conversationHistory.push({ role: 'user', content: text });
  showTyping();

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: conversationHistory
      })
    });
    const data = await res.json();
    removeTyping();
    const reply = data.content?.[0]?.text || 'Sorry, try again.';
    conversationHistory.push({ role: 'assistant', content: reply });
    addMessage('bot', reply);
  } catch (e) {
    removeTyping();
    addMessage('bot', 'Connection error. Please try again.');
  }

  isLoading = false;
  document.getElementById('sendBtn').disabled = false;
}