let map;
let centerMarker;
let markersLayer = L.layerGroup(); 
let currentPos = { lat: 22.75, lon: 88.37 }; 

const manualFireStations = [
    { name: "Barrackpore Fire Station", lat: 22.7634, lon: 88.3745, addr: "BT Rd, North 24 Pgs", phone: "033-2592-0022" },
    { name: "Habra Fire Station", lat: 22.8465, lon: 88.6534, addr: "Habra, North 24 Pgs", phone: "03216-237101" },
    { name: "Barasat Fire Station", lat: 22.7230, lon: 88.4870, addr: "Barasat, North 24 Pgs", phone: "033-2552-3222" },
    { name: "Howrah Fire Station", lat: 22.5833, lon: 88.3333, addr: "G.T. Road, Howrah", phone: "033-2638-3222" }
];

const manualAmbulances = [
    { name: "Barrackpore Municipality Ambulance", lat: 22.76, lon: 88.37, addr: "Town Hall, Barrackpore", phone: "033-2592-0405" },
    { name: "Kolkata Emergency Ambulance", lat: 22.57, lon: 88.43, addr: "Salt Lake", phone: "9830088888" }
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
        }
    } catch (e) { console.error(e); }
}

async function findEmergency(type) {
    const list = document.getElementById('nearby-list');
    list.innerHTML = `<li class="placeholder">Searching for ${type}...</li>`;
    markersLayer.clearLayers();

    let overpassType = type;
    if (type === 'ambulance') overpassType = 'ambulance_station';

    const query = `[out:json];node["amenity"="${overpassType}"](around:50000,${currentPos.lat},${currentPos.lon});out;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        let results = data.elements;
        
        if (type === 'fire_station') results = [...results, ...manualFireStations];
        if (type === 'ambulance') results = [...results, ...manualAmbulances];

        list.innerHTML = "";
        if (results.length === 0) { list.innerHTML = `<li class="placeholder">No ${type} found.</li>`; return; }

        results.forEach(item => {
            const name = item.tags ? (item.tags.name || `Unnamed ${type}`) : item.name;
            const addr = item.tags ? (item.tags["addr:street"] || "Near your area") : item.addr;
            const phone = item.tags ? (item.tags.phone || item.tags["contact:phone"] || "") : (item.phone || "");
            const lat = item.lat;
            const lon = item.lon;
            
            // FIXED DIRECTION LINK
            const directionsUrl = `http://googleusercontent.com/maps.google.com/?q=${lat},${lon}`;

            L.marker([lat, lon]).addTo(markersLayer).bindPopup(`<b>${name}</b>`);

            const li = document.createElement('li');
            li.className = "result-item";
            let callBtn = phone ? `<a href="tel:${phone}" class="call-link">📞 CALL: ${phone}</a>` : '';

            li.innerHTML = `
                <strong>${name} ${item.tags ? '' : '✅'}</strong>
                <small>${addr}</small>
                ${callBtn}
                <a href="${directionsUrl}" target="_blank" class="direction-link">📍 GET DIRECTIONS</a>
            `;
            list.appendChild(li);
        });
    } catch (e) { console.error(e); }
}

async function sendSOS() {
    const googleMapsUrl = `http://googleusercontent.com/maps.google.com/?q=${currentPos.lat},${currentPos.lon}`;
    if (navigator.share) {
        await navigator.share({ title: 'SOS', text: `Help! Location: ${googleMapsUrl}` });
    } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(googleMapsUrl)}`, '_blank');
    }
}

function openModal() { document.getElementById("helpModal").style.display = "block"; }
function closeModal() { document.getElementById("helpModal").style.display = "none"; }

// --- FIXED SCROLL LISTENER ---
const resultsPanel = document.getElementById('results-panel');
const sidebar = document.getElementById('main-sidebar');

resultsPanel.addEventListener('scroll', () => {
    // If user scrolls even a little bit (10px), shrink the sidebar
    if (resultsPanel.scrollTop > 10) {
        sidebar.classList.add('collapsed');
    } else {
        sidebar.classList.remove('collapsed');
    }
});

window.onload = initMap;