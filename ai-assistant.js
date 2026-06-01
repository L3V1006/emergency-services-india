// ============================================================
//  Emergency AI Assistant — ai-assistant.js
//  High-Speed Offline-First Response Engine (0ms Loading Time)
// ============================================================

const EMERGENCY_KNOWLEDGE_BASE = {
    helplines: `<strong>🚨 National Emergency Numbers (India):</strong><br>
    <ul>
        <li><span class="step-num">112</span> Universal Emergency Helpline</li>
        <li><span class="step-num">102</span> Ambulance Service</li>
        <li><span class="step-num">101</span> Fire Brigade</li>
        <li><span class="step-num">100</span> Police Department</li>
        <li><span class="step-num">1098</span> Child Helpline</li>
        <li><span class="step-num">181</span> Women Helpline</li>
    </ul>`,
    
    heartattack: `<strong>❤️ Heart Attack First Aid Steps:</strong><br>
    <ul>
        <li><strong>Call 112/102 immediately</strong> for an ambulance.</li>
        <li>Have the person sit down, rest, and try to remain calm.</li>
        <li>Loosen any tight clothing around their neck or chest.</li>
        <li>If the person is fully conscious and not allergic, give them an Aspirin (300mg) to chew slowly.</li>
        <li>If they lose consciousness and stop breathing, begin <strong>CPR immediately</strong>.</li>
    </ul>`,
    
    cpr: `<strong>🫁 How to Perform CPR (Cardiopulmonary Resuscitation):</strong><br>
    <ul>
        <li><strong>Call 112/102 immediately.</strong></li>
        <li>Place the heel of one hand on the center of the person's chest, and the other hand on top.</li>
        <li>Push hard and fast in the center of the chest (100 to 120 compressions per minute).</li>
        <li>Allow the chest to rise completely between compressions.</li>
        <li>Keep performing compressions until professional medical help arrives.</li>
    </ul>`,
    
    burns: `<strong>🔥 First Aid for Minor Burns:</strong><br>
    <ul>
        <li>Cool the burn under cold running tap water for at least 10 to 20 minutes immediately.</li>
        <li>Do NOT use ice, ice water, butter, or oil on the burn wound.</li>
        <li>Remove any rings or tight items from the burned area before it swells.</li>
        <li>Cover the area loosely with a sterile gauze bandage or clean plastic wrap.</li>
        <li>Take a pain reliever if necessary. For deep or large burns, seek immediate medical care.</li>
    </ul>`,
    
    bleeding: `<strong>🩸 How to Stop Severe Bleeding:</strong><br>
    <ul>
        <li>Apply firm, direct pressure onto the wound using a clean cloth, bandage, or your gloved hands.</li>
        <li>Maintain constant pressure without lifting the cloth to check if it has stopped.</li>
        <li>If blood seeps through, add another cloth layer on top—do not remove the original layer.</li>
        <li>Elevate the bleeding limb above heart level if possible.</li>
        <li>Keep the person warm and lying down until help arrives.</li>
    </ul>`,
    
    choking: `<strong>😮‍💨 First Aid for Choking (Heimlich Maneuver):</strong><br>
    <ul>
        <li>Stand behind the choking person and lean them slightly forward.</li>
        <li>Give 5 sharp blows between their shoulder blades with the heel of your hand.</li>
        <li>If the blockage remains, wrap your arms around their waist.</li>
        <li>Make a fist, place it just above their navel, grasp it with your other hand, and press hard into the abdomen with a quick upward thrust.</li>
        <li>Repeat up to 5 times. If they lose consciousness, lower them to the ground and start CPR.</li>
    </ul>`,
    
    sos: `<strong>🆘 How to use the SOS feature:</strong><br>
    <ul>
        <li>Tap the bright red <strong>"SOS: SHARE MY GPS"</strong> button in the main control section of the app.</li>
        <li>If your smartphone supports direct native sharing, a window will pop up allowing you to choose your contact.</li>
        <li>If native sharing is unavailable, the app will instantly open WhatsApp Web with a pre-configured text containing your live coordinates via a Google Maps tracking link.</li>
    </ul>`,
    
    default: `<strong>👋 Hello! I am your Emergency First-Aid Assistant.</strong><br><br>
    For critical safety, please <strong>Call 112 or 102 immediately</strong>.<br><br>
    Tell me what the situation is, or click one of the quick assistance suggestions below:<br>
    • Try asking about: <strong>cpr</strong>, <strong>bleeding</strong>, <strong>burns</strong>, <strong>choking</strong>, or <strong>heart attack</strong>.`
};

let aiChatOpen = false;
let aiTyping   = false;

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('ai-fab').addEventListener('click', toggleAIChat);
    document.getElementById('ai-close-btn').addEventListener('click', toggleAIChat);
    document.getElementById('ai-send-btn').addEventListener('click', sendAIMessage);

    document.getElementById('ai-user-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') sendAIMessage();
    });

    document.getElementById('chip1').addEventListener('click', function () { askChip('helplines'); });
    document.getElementById('chip2').addEventListener('click', function () { askChip('heartattack'); });
    document.getElementById('chip3').addEventListener('click', function () { askChip('sos'); });
});

function toggleAIChat() {
    aiChatOpen = !aiChatOpen;
    const panel = document.getElementById('ai-chat-panel');
    const fab   = document.getElementById('ai-fab');

    if (aiChatOpen) {
        panel.classList.add('open');
        fab.classList.add('active');
        setTimeout(function () {
            document.getElementById('ai-user-input').focus();
        }, 300);
    } else {
        panel.classList.remove('open');
        fab.classList.remove('active');
    }
}

function askChip(key) {
    document.getElementById('ai-chips').style.display = 'none';
    showTyping();
    setStatus('Thinking...', true);
    
    setTimeout(() => {
        removeTyping();
        appendMessage('bot', EMERGENCY_KNOWLEDGE_BASE[key]);
        setStatus('Online', false);
    }, 400);
}

function appendMessage(role, html) {
    const box  = document.getElementById('ai-messages');
    const wrap = document.createElement('div');
    wrap.className = 'ai-msg ' + role;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = html;

    wrap.appendChild(bubble);
    box.appendChild(wrap);
    box.scrollTop = box.scrollHeight;
}

function showTyping() {
    const box  = document.getElementById('ai-messages');
    const wrap = document.createElement('div');
    wrap.className = 'ai-msg bot';
    wrap.id = 'ai-typing';
    wrap.innerHTML = '<div class="msg-bubble typing-bubble"><span></span><span></span><span></span></div>';
    box.appendChild(wrap);
    box.scrollTop = box.scrollHeight;
}

function removeTyping() {
    const el = document.getElementById('ai-typing');
    if (el) el.remove();
}

function setStatus(text, thinking) {
    const el = document.getElementById('ai-status');
    if (!el) return;
    el.textContent = text;
    el.className = 'ai-status' + (thinking ? ' thinking' : '');
}

function sendAIMessage() {
    if (aiTyping) return;

    const input = document.getElementById('ai-user-input');
    const text  = input.value.trim().toLowerCase();
    if (!text) return;

    const chips = document.getElementById('ai-chips');
    if (chips) chips.style.display = 'none';

    input.value = '';
    appendMessage('user', text);
    
    aiTyping = true;
    showTyping();
    setStatus('Thinking...', true);

    // Instant localized intent processing matching keywords cleanly
    setTimeout(() => {
        removeTyping();
        aiTyping = false;
        setStatus('Online', false);

        if (text.includes('cpr') || text.includes('breathe') || text.includes('resuscitation')) {
            appendMessage('bot', EMERGENCY_KNOWLEDGE_BASE.cpr);
        } else if (text.includes('heart') || text.includes('attack') || text.includes('chest pain')) {
            appendMessage('bot', EMERGENCY_KNOWLEDGE_BASE.heartattack);
        } else if (text.includes('number') || text.includes('helpline') || text.includes('call') || text.includes('phone')) {
            appendMessage('bot', EMERGENCY_KNOWLEDGE_BASE.helplines);
        } else if (text.includes('burn') || text.includes('fire wound')) {
            appendMessage('bot', EMERGENCY_KNOWLEDGE_BASE.burns);
        } else if (text.includes('bleed') || text.includes('blood') || text.includes('cut')) {
            appendMessage('bot', EMERGENCY_KNOWLEDGE_BASE.bleeding);
        } else if (text.includes('choke') || text.includes('swallow')) {
            appendMessage('bot', EMERGENCY_KNOWLEDGE_BASE.choking);
        } else if (text.includes('sos') || text.includes('share')) {
            appendMessage('bot', EMERGENCY_KNOWLEDGE_BASE.sos);
        } else {
            appendMessage('bot', EMERGENCY_KNOWLEDGE_BASE.default);
        }
    }, 400); // 400ms delay just to make the typing bubbles look realistic!
}