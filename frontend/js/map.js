const map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: ' OpenStreetMap'
}).addTo(map);

async function loadMarkers() {
    const caseList = document.getElementById("caseList");
    const sidebarCount = document.getElementById("sidebarCount");

    try {
        const res = await fetch(`${API_BASE}/cases`);
        const data = await res.json();

        const activeCases = data.filter(c => c.status !== "found");

        sidebarCount.textContent = `${activeCases.length} active monitoring alert${activeCases.length !== 1 ? 's' : ''}`;

        if (activeCases.length === 0) {
            caseList.innerHTML = `<div class="text-gray-500 text-xs p-4 text-center">No active cases.</div>`;
            return;
        }

        const bounds = [];

        activeCases.forEach(c => {
            const isHigh = c.priorityScore > 50;

            const item = document.createElement("div");
            item.className = `p-3 mb-1 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors border-l-2 ${isHigh ? 'border-red-500 bg-gray-800' : 'border-gray-600'}`;
            item.innerHTML = `
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-black px-1.5 py-0.5 rounded tracking-wider ${isHigh ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'}">
                        ${isHigh ? 'URGENT' : 'ACTIVE'}
                    </span>
                    <span class="text-gray-400 text-xs">${c.timeSince}</span>
                </div>
                <div class="font-bold text-sm text-white">${c.name}</div>
                <div class="text-gray-400 text-xs mt-0.5">
                    ${c.lastSeenLocation?.lat
                        ? `${Number(c.lastSeenLocation.lat).toFixed(3)}, ${Number(c.lastSeenLocation.lng).toFixed(3)}`
                        : 'Location unknown'}
                </div>
            `;

            if (c.lastSeenLocation?.lat && c.lastSeenLocation?.lng) {
                const lat = c.lastSeenLocation.lat;
                const lng = c.lastSeenLocation.lng;
                bounds.push([lat, lng]);

                const marker = L.circleMarker([lat, lng], {
                    radius: isHigh ? 12 : 8,
                    color: isHigh ? '#dc2626' : '#2563eb',
                    fillColor: isHigh ? '#ef4444' : '#3b82f6',
                    fillOpacity: 0.85,
                    weight: 2
                }).addTo(map);

                marker.bindPopup(`
                    <div style="min-width:150px;font-family:Inter,sans-serif">
                        <strong style="font-size:13px">${c.name}</strong><br>
                        <span style="color:#6b7280;font-size:11px">Age: ${c.age ?? 'Unknown'}</span><br>
                        <span style="color:#6b7280;font-size:11px">Last seen: ${c.timeSince}</span><br>
                        <span style="color:${isHigh ? '#dc2626' : '#2563eb'};font-size:11px;font-weight:bold">
                            Priority: ${c.priorityScore?.toFixed(1)}
                        </span>
                    </div>
                `);

                item.onclick = () => {
                    map.setView([lat, lng], 13);
                    marker.openPopup();
                };
            }

            caseList.appendChild(item);
        });

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [40, 40] });
        }

    } catch (err) {
        console.error("Map error:", err);
        caseList.innerHTML = `<div class="text-red-400 text-xs p-4 text-center">Error loading cases.<br>Is the API running?</div>`;
    }
}

loadMarkers();