async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/cases`);
        const data = await res.json();

        document.getElementById("caseCount").textContent = data.length.toLocaleString();

        const highPriority = data.filter(c => c.priorityScore > 50);
        document.getElementById("highPriorityCount").textContent = highPriority.length;

        const trend = document.getElementById("caseTrend");
        trend.textContent = data.length > 0
            ? `↑ ${data.length} active cases being monitored`
            : "No active cases";

        const sightingsDiv = document.getElementById("recentSightings");
        if (data.length > 0) {
            sightingsDiv.innerHTML = data.slice(0, 2).map(c => `
                <div class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div class="w-9 h-9 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center text-gray-400 text-base">👤</div>
                    <div>
                        <div class="text-sm font-semibold text-gray-800">${c.name}</div>
                        <div class="text-xs text-gray-400">${c.timeSince}</div>
                    </div>
                </div>
            `).join('');
        } else {
            sightingsDiv.innerHTML = `<div class="text-xs text-gray-400 py-2">No recent cases.</div>`;
        }

    } catch (err) {
        console.error("ERROR loading stats:", err);
        document.getElementById("caseCount").textContent = "—";
        document.getElementById("highPriorityCount").textContent = "—";
        document.getElementById("caseTrend").textContent = "API not reachable";
    }
}

async function loadHomeMap() {
    const el = document.getElementById("homeMap");
    if (!el || typeof L === "undefined") return;
    try {
        const map = L.map("homeMap", { zoomControl: false }).setView([20, 0], 2);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

        const res = await fetch(`${API_BASE}/cases`);
        const data = await res.json();
        data.forEach(c => {
            if (c.lastSeenLocation?.lat && c.lastSeenLocation?.lng) {
                L.circleMarker([c.lastSeenLocation.lat, c.lastSeenLocation.lng], {
                    radius: 8, color: "#dc2626", fillColor: "#dc2626", fillOpacity: 0.75, weight: 2
                }).addTo(map).bindPopup(`<b>${c.name}</b><br>${c.timeSince}`);
            }
        });
    } catch (err) {
        console.error("Home map error:", err);
    }
}

loadStats();
loadHomeMap();