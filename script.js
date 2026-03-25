let map;
let centerMarker;
let markersLayer = L.layerGroup(); 
let currentPos = { lat: 22.75, lon: 88.37 }; 

const manualFireStations = [
    { name: "Barrackpore Fire Station", lat: 22.7634, lon: 88.3745, addr: "BT Rd, North 24 Pgs", phone: "033-2592-0022" },
    { name: "Habra Fire Station", lat: 22.8465, lon: 88.6534, addr: "Habra, North 24 Pgs", phone: "03216-237101" },
    { name: "Barasat Fire Station", lat: 22.7230, lon: 88.4870, addr: "Barasat, North 24 Pgs", phone: "033-2552-3222" },
    { name: "Naihati Fire Station", lat: 22.8913, lon: 88.4239, addr: "Naihati, North 24 Pgs", phone: "033-2581-2222" },
    { name: "Dum Dum Fire Station", lat: 22.6215, lon: 88.3934, addr: "Dum Dum Rd, Kolkata", phone: "033-2551-3222" },
    { name: "Bidhannagar Fire Station", lat: 22.5867, lon: 88.4170, addr: "Sector V, Salt Lake", phone: "033-2357-3222" },
    { name: "Kolkata Fire HQ", lat: 22.5535, lon: 88.3540, addr: "Mirza Ghalib St, Kolkata", phone: "033-2252-1122" },
    { name: "Howrah Fire Station", lat: 22.5833, lon: 88.3333, addr: "G.T. Road, Howrah", phone: "033-2638-3222" },
    { name: "Kalyani Fire Station", lat: 22.9751, lon: 88.4345, addr: "Kalyani, Nadia", phone: "033-2582-8222" }
];

// NEW: Manual Ambulance List for your area
const manualAmbulances = [
    { name: "Barrackpore Municipality Ambulance", lat: 22.76, lon: 88.37, addr: "Town Hall, Barrackpore", phone: "033-2592-0405" },
    { name: "B.N. Bose Hospital Ambulance", lat: 22.758, lon: 88.372, addr: "Barrackpore HQ", phone: "033-2592-0035" },
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
            document.getElementById('nearby-list').innerHTML = `<li class="placeholder">Now select a service for ${query}.</li>`;
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
        
        // Merge Manual Data
        if (type === 'fire_station') results = [...results, ...manualFireStations];
        if (type === 'ambulance') results = [...results, ...manualAmbulances];

        list.innerHTML = "";
        if (results.length === 0) { list.innerHTML = `<li class="placeholder">No ${type} found in 50km.</li>`; return; }

        results.forEach(item => {
            const name = item.tags ? (item.tags.name || `Unnamed ${type}`) : item.name;
            const addr = item.tags ? (item.tags["addr:street"] || "Near your area") : item.addr;
            const phone = item.tags ? (item.tags.phone || item.tags["contact:phone"] || "") : (item.phone || "");
            const lat = item.lat;
            const lon = item.lon;
            
            // FIXED URL Logic
            const directionsUrl = `https://www.google.com/maps?q=${lat},${lon}`;

            L.marker([lat, lon]).addTo(markersLayer).bindPopup(`<b>${name}</b>`);

            const li = document.createElement('li');
            li.className = "result-item";
            
            // Logic to show CALL button only if phone exists
            let callButton = phone ? `<a href="tel:${phone}" class="call-link">📞 CALL NOW: ${phone}</a>` : '';

            li.innerHTML = `
                <strong>${name} ${item.tags ? '' : '✅'}</strong>
                <small>${addr}</small>
                ${callButton}
                <a href="${directionsUrl}" target="_blank" class="direction-link">📍 GET DIRECTIONS</a>
            `;
            list.appendChild(li);
        });
    } catch (e) { console.error(e); }
}

async function sendSOS() {
    const googleMapsUrl = `https://www.google.com/maps?q=${currentPos.lat},${currentPos.lon}`;
    const msg = `EMERGENCY! I need help. My current location is: ${googleMapsUrl}`;

    if (navigator.share) {
        await navigator.share({ title: 'SOS EMERGENCY', text: msg });
    } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
}

function openModal() { document.getElementById("helpModal").style.display = "block"; }
function closeModal() { document.getElementById("helpModal").style.display = "none"; }
window.onclick = function(event) {
    let modal = document.getElementById("helpModal");
    if (event.target == modal) modal.style.display = "none";
}

window.onload = initMap;