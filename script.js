let map;
let centerMarker;
let markersLayer = L.layerGroup(); 
let currentPos = { lat: 22.75, lon: 88.37 }; 

const manualFireStations = [
    { name: "Barrackpore Fire Station", lat: 22.7634, lon: 88.3745, addr: "BT Rd, North 24 Pgs" },
    { name: "Habra Fire Station", lat: 22.8465, lon: 88.6534, addr: "Habra, North 24 Pgs" },
    { name: "Barasat Fire Station", lat: 22.7230, lon: 88.4870, addr: "Barasat, North 24 Pgs" },
    { name: "Naihati Fire Station", lat: 22.8913, lon: 88.4239, addr: "Naihati, North 24 Pgs" },
    { name: "Dum Dum Fire Station", lat: 22.6215, lon: 88.3934, addr: "Dum Dum Rd, Kolkata" },
    { name: "Bidhannagar Fire Station", lat: 22.5867, lon: 88.4170, addr: "Sector V, Salt Lake" },
    { name: "Kolkata Fire HQ", lat: 22.5535, lon: 88.3540, addr: "Mirza Ghalib St, Kolkata" },
    { name: "Manicktala Fire Station", lat: 22.5855, lon: 88.3794, addr: "Vip Road, Manicktala" },
    { name: "Cossipore Fire Station", lat: 22.6175, lon: 88.3712, addr: "Cossipore Road, Kolkata" },
    { name: "Howrah Fire Station", lat: 22.5833, lon: 88.3333, addr: "G.T. Road, Howrah" },
    { name: "Bally Fire Station", lat: 22.6469, lon: 88.3427, addr: "Bally, Howrah" },
    { name: "Uluberia Fire Station", lat: 22.4646, lon: 88.1064, addr: "Uluberia, Howrah" },
    { name: "Serampore Fire Station", lat: 22.7505, lon: 88.3442, addr: "Mahesh, Serampore" },
    { name: "Chinsurah Fire Station", lat: 22.9069, lon: 88.3912, addr: "Hooghly Ghat, Chinsurah" },
    { name: "Chandannagar Fire Station", lat: 22.8671, lon: 88.3674, addr: "G.T. Road, Chandannagar" },
    { name: "Dankuni Fire Station", lat: 22.6841, lon: 88.2949, addr: "Dankuni, Hooghly" },
    { name: "Tarakeswar Fire Station", lat: 22.8860, lon: 88.0200, addr: "Tarakeswar, Hooghly" },
    { name: "Kalyani Fire Station", lat: 22.9751, lon: 88.4345, addr: "Kalyani, Nadia" },
    { name: "Chakdaha Fire Station", lat: 23.0800, lon: 88.5200, addr: "Chakdaha, Nadia" },
    { name: "Sonarpur Fire Station", lat: 22.4385, lon: 88.4330, addr: "Sonarpur, South 24 Pgs" },
    { name: "Budge Budge Fire Station", lat: 22.4820, lon: 88.1818, addr: "Budge Budge, South 24 Pgs" },
    { name: "Behala Fire Station", lat: 22.4990, lon: 88.3180, addr: "Diamond Harbour Rd, Behala" }
];

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

function initMap() {
    map = L.map('map').setView([currentPos.lat, currentPos.lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    markersLayer.addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            currentPos.lat = position.coords.latitude;
            currentPos.lon = position.coords.longitude;
            updateMapToPos("Your Current Location");
        });
    }
}

function updateMapToPos(label) {
    map.setView([currentPos.lat, currentPos.lon], 15);
    if (centerMarker) map.removeLayer(centerMarker);
    centerMarker = L.marker([currentPos.lat, currentPos.lon], { icon: redIcon }).addTo(map)
        .bindPopup(`<b>${label}</b>`).openPopup();
}

async function searchLocation() {
    const query = document.getElementById('location-input').value;
    if (!query) return;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.length > 0) {
            currentPos.lat = parseFloat(data[0].lat);
            currentPos.lon = parseFloat(data[0].lon);
            updateMapToPos(query);
            markersLayer.clearLayers();
            document.getElementById('nearby-list').innerHTML = `<li class="placeholder">Now select a service for ${query}.</li>`;
        }
    } catch (e) { console.error(e); }
}

async function findEmergency(type) {
    const list = document.getElementById('nearby-list');
    list.innerHTML = `<li class="placeholder">Searching for ${type}...</li>`;
    markersLayer.clearLayers();

    const query = `[out:json];node["amenity"="${type}"](around:50000,${currentPos.lat},${currentPos.lon});out;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        let results = data.elements;
        if (type === 'fire_station') results = [...results, ...manualFireStations];

        list.innerHTML = "";
        if (results.length === 0) { list.innerHTML = `<li class="placeholder">No ${type} found in 50km.</li>`; return; }

        results.forEach(item => {
            const name = item.tags ? (item.tags.name || "Unnamed Station") : item.name;
            const addr = item.tags ? (item.tags["addr:street"] || "Near your area") : item.addr;
            const lat = item.lat;
            const lon = item.lon;
            
            // --- FIXED DIRECTIONS LINK ---
            const directionsUrl = `https://www.google.com/maps?q=${lat},${lon}`;

            L.marker([lat, lon]).addTo(markersLayer).bindPopup(`<b>${name}</b><br><a href="${directionsUrl}" target="_blank" class="popup-btn" style="color:white; background:#3b82f6; padding:5px; border-radius:4px; text-decoration:none; display:inline-block; margin-top:5px;">Directions</a>`);

            const li = document.createElement('li');
            li.className = "result-item";
            li.innerHTML = `<strong>${name} ${item.tags ? '' : '✅'}</strong><small>${addr}</small><a href="${directionsUrl}" target="_blank" class="direction-link">📍 GET DIRECTIONS</a>`;
            list.appendChild(li);
        });
    } catch (e) { console.error(e); }
}

async function sendSOS() {
    // --- FIXED SOS LINK ---
    const googleMapsUrl = `https://www.google.com/maps?q=${currentPos.lat},${currentPos.lon}`;
    const msg = `EMERGENCY! I need help. My current location is: ${googleMapsUrl}`;

    if (navigator.share) {
        await navigator.share({ title: 'SOS EMERGENCY', text: msg });
    } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
}

// MODAL CONTROLS
function openModal() { document.getElementById("helpModal").style.display = "block"; }
function closeModal() { document.getElementById("helpModal").style.display = "none"; }
window.onclick = function(event) {
    let modal = document.getElementById("helpModal");
    if (event.target == modal) modal.style.display = "none";
}

window.onload = initMap;