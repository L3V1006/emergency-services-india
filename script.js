let map;
let centerMarker;
let markersLayer = L.layerGroup(); 
let currentPos = { lat: 22.75, lon: 88.37 }; 

const manualFireStations = [
    { name: "Barrackpore Fire Station", lat: 22.7634, lon: 88.3745, addr: "BT Rd, North 24 Pgs", phone: "03325920022" },
    { name: "Habra Fire Station", lat: 22.8465, lon: 88.6534, addr: "Habra, North 24 Pgs", phone: "03216237101" },
    { name: "Barasat Fire Station", lat: 22.7230, lon: 88.4870, addr: "Barasat, North 24 Pgs", phone: "03325523222" },
    { name: "Howrah Fire Station", lat: 22.5833, lon: 88.3333, addr: "G.T. Road, Howrah", phone: "03326383222" }
];

const manualAmbulances = [
    { name: "Barrackpore Municipality Ambulance", lat: 22.76, lon: 88.37, addr: "Town Hall, Barrackpore", phone: "03325920405" },
    { name: "B.N. Bose Hospital Ambulance", lat: 22.758, lon: 88.372, addr: "Barrackpore HQ", phone: "03325920035" },
    { name: "Kolkata Emergency Ambulance", lat: 22.57, lon: 88.43, addr: "Salt Lake", phone: "9830088888" }
];

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

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
    const sidebar = document.getElementById('main-sidebar');
    list.innerHTML = `<li class="placeholder">Searching for ${type}...</li>`;
    markersLayer.clearLayers();

    let overpassType = type === 'ambulance' ? 'ambulance_station' : type;
    
    // RADIUS UPDATED TO 25000 (25km)
    const query = `[out:json];node["amenity"="${overpassType}"](around:25000,${currentPos.lat},${currentPos.lon});out;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        let results = data.elements;
        
        if (type === 'fire_station') results = [...results, ...manualFireStations];
        if (type === 'ambulance') results = [...results, ...manualAmbulances];

        // Calc Distance and Sort
        results = results.map(item => {
            return {
                ...item,
                distance: getDistance(currentPos.lat, currentPos.lon, item.lat, item.lon)
            };
        });
        results.sort((a, b) => a.distance - b.distance);

        list.innerHTML = "";
        if (results.length === 0) { list.innerHTML = `<li class="placeholder">No results found in 25km.</li>`; return; }

        results.forEach(item => {
            const name = item.tags ? (item.tags.name || `Unnamed ${type}`) : item.name;
            const addr = item.tags ? (item.tags["addr:street"] || "Near your area") : item.addr;
            const phone = item.tags ? (item.tags.phone || item.tags["contact:phone"] || "") : (item.phone || "");
            const lat = item.lat;
            const lon = item.lon;
            const dist = item.distance.toFixed(1);
            
            // FIXED: directionsUrl with correct backticks and ${lat}
            const directionsUrl = `http://googleusercontent.com/maps.google.com/?q=${lat},${lon}`;

            L.marker([lat, lon]).addTo(markersLayer).bindPopup(`<b>${name}</b><br>${dist} km away`);

            const li = document.createElement('li');
            li.className = "result-item";
            let callBtn = phone ? `<a href="tel:${phone}" class="call-link">📞 CALL NOW: ${phone}</a>` : '';

            li.innerHTML = `
                <div class="distance-badge">📍 ${dist} km away</div><br>
                <strong>${name} ${item.tags ? '' : '✅'}</strong>
                <small>${addr}</small>
                ${callBtn}
                <a href="${directionsUrl}" target="_blank" class="direction-link">📍 GET DIRECTIONS</a>
            `;
            list.appendChild(li);
        });
    } catch (e) { console.error(e); }
}

function openModal() { document.getElementById("helpModal").style.display = "block"; }
function closeModal() { document.getElementById("helpModal").style.display = "none"; }

const resultsPanel = document.getElementById('results-panel');
const sidebar = document.getElementById('main-sidebar');

resultsPanel.addEventListener('scroll', () => {
    if (window.innerWidth > 768) { 
        if (resultsPanel.scrollTop > 10) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
    }
});

async function sendSOS() {
    const googleMapsUrl = `http://googleusercontent.com/maps.google.com/?q=${currentPos.lat},${currentPos.lon}`;
    if (navigator.share) {
        await navigator.share({ title: 'SOS', text: `Help! My location: ${googleMapsUrl}` });
    } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(googleMapsUrl)}`, '_blank');
    }
}

window.onload = initMap;