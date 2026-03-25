let map; let centerMarker; let markersLayer = L.layerGroup(); 
let currentPos = { lat: 22.75, lon: 88.37 }; 

// --- AI CHAT LOGIC ---
const GEMINI_API_KEY = 'AIzaSyCvbJEEm_tI4ZBUfQKeu5TcPUdtZz-ucMI';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

function toggleChat() {
    const w = document.getElementById('chat-wrapper');
    w.classList.toggle('chat-closed');
    document.getElementById('chat-toggle-icon').innerText = w.classList.contains('chat-closed') ? '▲' : '▼';
}

async function askAI() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    appendMessage('user', text);
    input.value = '';

    // System prompt helps the AI stay focused and safe
    const prompt = `System Instructions: You are a First-Aid Assistant. Give VERY SHORT (under 50 words), bulleted tips. Always start with: 'Call 112/102 immediately.' \nUser Question: ${text}`;

    try {
        const resp = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!resp.ok) {
            throw new Error(`API Status: ${resp.status}`);
        }

        const data = await resp.json();
        const responseText = data.candidates[0].content.parts[0].text;
        appendMessage('ai', responseText);
    } catch (e) {
        console.error("AI Error Details:", e);
        appendMessage('ai', "Error connecting. Please check internet or call 112 directly.");
    }
}

function appendMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerText = text;
    const container = document.getElementById('chat-messages');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// --- DISTANCE & MAP LOGIC ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function initMap() {
    map = L.map('map').setView([currentPos.lat, currentPos.lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    markersLayer.addTo(map);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(p => {
            currentPos.lat = p.coords.latitude; currentPos.lon = p.coords.longitude;
            updateMapToPos("You are here");
        });
    }
}

function updateMapToPos(label) {
    map.setView([currentPos.lat, currentPos.lon], 15);
    if (centerMarker) map.removeLayer(centerMarker);
    centerMarker = L.marker([currentPos.lat, currentPos.lon], { icon: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] }) }).addTo(map).bindPopup(label).openPopup();
}

async function findEmergency(type) {
    const list = document.getElementById('nearby-list');
    list.innerHTML = `<li class="placeholder">Searching...</li>`;
    markersLayer.clearLayers();

    const query = `[out:json];node["amenity"="${type === 'ambulance' ? 'ambulance_station' : type}"](around:50000,${currentPos.lat},${currentPos.lon});out;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const resp = await fetch(url);
        const data = await resp.json();
        let results = data.elements.map(item => ({ ...item, distance: getDistance(currentPos.lat, currentPos.lon, item.lat, item.lon) }));
        results.sort((a, b) => a.distance - b.distance);

        list.innerHTML = "";
        if (results.length === 0) { list.innerHTML = `<li class="placeholder">No results in 50km.</li>`; return; }

        results.forEach(item => {
            const dist = item.distance.toFixed(1);
            const name = item.tags.name || "Emergency Point";
            
            // Standard Navigation URL
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lon}`;
            
            L.marker([item.lat, item.lon]).addTo(markersLayer).bindPopup(`<b>${name}</b><br>${dist} km`);

            const li = document.createElement('li');
            li.className = "result-item";
            li.innerHTML = `<div class="distance-badge">📍 ${dist} km away</div><br><strong>${name}</strong><a href="${directionsUrl}" target="_blank" class="direction-link">📍 GET DIRECTIONS</a>`;
            list.appendChild(li);
        });
    } catch (e) { list.innerHTML = "Error loading data."; }
}

async function searchLocation() {
    const q = document.getElementById('location-input').value;
    if (!q) return;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
    try {
        const resp = await fetch(url);
        const data = await resp.json();
        if (data[0]) { currentPos.lat = parseFloat(data[0].lat); currentPos.lon = parseFloat(data[0].lon); updateMapToPos(q); markersLayer.clearLayers(); }
    } catch (e) { console.error(e); }
}

function openModal() { document.getElementById("helpModal").style.display = "block"; }
function closeModal() { document.getElementById("helpModal").style.display = "none"; }
window.onclick = function(event) {
    let m = document.getElementById("helpModal");
    if (event.target == m) m.style.display = "none";
}

document.getElementById('results-panel').addEventListener('scroll', () => {
    if (window.innerWidth > 768) {
        document.getElementById('main-sidebar').classList.toggle('collapsed', document.getElementById('results-panel').scrollTop > 10);
    }
});

async function sendSOS() {
    const url = `https://www.google.com/maps/search/?api=1&query=${currentPos.lat},${currentPos.lon}`;
    if (navigator.share) await navigator.share({ title: 'SOS', text: `Help! My location: ${url}` });
    else window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
}

window.onload = initMap;