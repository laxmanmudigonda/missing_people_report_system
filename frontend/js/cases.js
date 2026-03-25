let allCases = [];
let activeFilter = "all";
let radiusFilter = null; // {lat, lng, km} or null
let radiusFilterActive = false;

async function loadCases() {
    const loadingMsg = document.getElementById("loadingMsg");
    try {
        const res = await fetch(`${API_BASE}/cases`);
        allCases = await res.json();
        renderCases();
    } catch (err) {
        loadingMsg.textContent = "Failed to load cases. Is the API server running?";
        loadingMsg.style.color = "#dc2626";
        console.error("Cases error:", err);
    }
}

function setFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("bg-gray-900", "text-white", "border-gray-900",
                             "bg-green-600", "border-green-600");
        btn.classList.add("border-gray-300", "text-gray-500");
    });
    const active = document.getElementById(`tab-${filter}`);
    if (filter === "found") {
        active.classList.remove("border-gray-300", "text-gray-500");
        active.classList.add("bg-green-600", "text-white", "border-green-600");
    } else {
        active.classList.remove("border-gray-300", "text-gray-500");
        active.classList.add("bg-gray-900", "text-white", "border-gray-900");
    }
    renderCases();
}

function renderCases() {
    const loadingMsg = document.getElementById("loadingMsg");
    const container = document.getElementById("casesContainer");
    container.innerHTML = "";

    const filtered = activeFilter === "all"
        ? allCases
        : allCases.filter(c => c.status === activeFilter);

    if (filtered.length === 0) {
        loadingMsg.style.display = "block";
        loadingMsg.textContent = activeFilter === "found"
            ? "No found cases yet."
            : "No active cases found.";
        return;
    }
    loadingMsg.style.display = "none";

    // Apply radius filter if active
    let displayed = filtered;
    if (radiusFilterActive && radiusFilter) {
        displayed = filtered.filter(c => {
            if (!c.lastSeenLocation?.lat) return false;
            return haversineKm(
                radiusFilter.lat, radiusFilter.lng,
                c.lastSeenLocation.lat, c.lastSeenLocation.lng
            ) <= radiusFilter.km;
        });
        const msg = document.getElementById("radiusMsg");
        msg.textContent = `📍 Showing ${displayed.length} case(s) within ${radiusFilter.km} km of your location.`;
        msg.classList.remove("hidden");
        if (displayed.length === 0) {
            loadingMsg.style.display = "block";
            loadingMsg.textContent = "No cases found within the selected radius.";
            return;
        }
    }

    displayed.forEach(c => buildCard(c, container));
}

function buildCard(c, container) {
    const isFound = c.status === "found";
    const isHighPriority = !isFound && c.priorityScore > 50;
    const hasPhoto = c.photo && c.photo !== "default.jpg" && c.photo !== "test.jpg";
    const photoUrl = hasPhoto
        ? `${API_BASE}/static/${c.photo}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=${isFound ? '16a34a' : '374151'}&color=fff&size=300&bold=true`;

    const locText = c.lastSeenLocation?.lat
        ? `${Number(c.lastSeenLocation.lat).toFixed(2)}°, ${Number(c.lastSeenLocation.lng).toFixed(2)}°`
        : "Unknown";

    const card = document.createElement("div");
    card.className = `case-card bg-white rounded-xl shadow overflow-hidden ${isFound ? 'opacity-80' : ''}`;
    card.id = `card-${c._id}`;
    card.innerHTML = `
        <div class="relative h-52 bg-gray-300 overflow-hidden">
            <img src="${photoUrl}"
                 class="w-full h-full object-cover"
                 onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=374151&color=fff&size=300'">
            ${isFound ? `
            <div class="absolute inset-0 bg-green-600/20 flex items-center justify-center">
                <div class="bg-green-600 text-white text-sm font-black px-4 py-1.5 rounded-full tracking-wider">✅ FOUND</div>
            </div>` : ''}
            ${isHighPriority ? `
            <div class="absolute top-2 left-2 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded tracking-wider">⚠ HIGH PRIORITY</div>
            ` : ''}
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 py-3">
                <div class="flex justify-between text-white text-xs font-semibold">
                    <span>LAST SEEN: <span class="font-normal">${c.timeSince}</span></span>
                    <span>LOCATION: <span class="font-normal">${locText}</span></span>
                </div>
            </div>
        </div>
        <div class="p-4">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h3 class="font-black text-gray-900">${c.name}</h3>
                    <p class="text-xs text-gray-500 mt-0.5">Age: ${c.age ?? 'Unknown'}</p>
                </div>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full ${isFound ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}">
                    ${isFound ? 'Found' : 'Missing'}
                </span>
            </div>
            <div class="space-y-2">
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="openDetails('${c._id}')"
                        class="bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                        🔍 Details
                    </button>
                    <button onclick="openEditModal('${c._id}')"
                        class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                        ✏️ Edit
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    ${!isFound ? `
                    <button onclick="markFound('${c._id}')"
                        class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                        ✅ Mark Found
                    </button>` : `
                    <button onclick="revertToMissing('${c._id}')"
                        class="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                        ↩ Mark Missing
                    </button>`}
                    <button onclick="deleteCase('${c._id}')"
                        class="bg-white hover:bg-red-50 border border-red-200 text-red-600 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                        🗑 Delete
                    </button>
                </div>
            </div>
        </div>
    `;
    container.appendChild(card);
}

async function markFound(caseId) {
    if (!confirm("Mark this person as found?")) return;
    try {
        const res = await fetch(`${API_BASE}/cases/${caseId}/found`, { method: "PATCH" });
        const data = await res.json();
        if (res.ok) {
            const c = allCases.find(x => x._id === caseId);
            if (c) c.status = "found";
            renderCases();
        } else {
            alert("Error: " + (data.error || "Could not update case."));
        }
    } catch (err) {
        alert("Connection error.");
        console.error(err);
    }
}

async function deleteCase(caseId) {
    if (!confirm("Permanently delete this case? This cannot be undone.")) return;
    try {
        const res = await fetch(`${API_BASE}/cases/${caseId}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok) {
            allCases = allCases.filter(x => x._id !== caseId);
            renderCases();
        } else {
            alert("Error: " + (data.error || "Could not delete case."));
        }
    } catch (err) {
        alert("Connection error.");
        console.error(err);
    }
}

loadCases();

// ========== MODAL LOGIC ==========

let detailMapInstance = null;
let sightingMapInstance = null;
let sightingMarker = null;
let currentSightingCaseId = null;

async function openDetails(caseId) {
    const c = allCases.find(x => x._id === caseId);
    if (!c) return;

    document.getElementById("detailName").textContent = c.name;
    document.getElementById("detailAge").textContent = c.age ?? "Unknown";
    document.getElementById("detailTimeSince").textContent = c.timeSince;
    document.getElementById("detailPriority").textContent = c.priorityScore?.toFixed(1);

    const statusEl = document.getElementById("detailStatus");
    statusEl.textContent = c.status === "found" ? "Found" : "Missing";
    statusEl.className = `font-black text-lg ${c.status === "found" ? "text-green-600" : "text-red-600"}`;

    const hasPhoto = c.photo && c.photo !== "default.jpg" && c.photo !== "test.jpg";
    const photoEl = document.getElementById("detailPhoto");
    photoEl.src = hasPhoto
        ? `${API_BASE}/static/${c.photo}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=374151&color=fff&size=200&bold=true`;
    photoEl.onerror = () => { photoEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=374151&color=fff&size=200`; };

    document.getElementById("detailModal").style.display = "flex";
    document.body.style.overflow = "hidden";

    // Init detail map after modal visible
    setTimeout(() => {
        if (detailMapInstance) { detailMapInstance.remove(); detailMapInstance = null; }
        detailMapInstance = L.map("detailMap").setView([20, 0], 2);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(detailMapInstance);

        if (c.lastSeenLocation?.lat && c.lastSeenLocation?.lng) {
            const lat = c.lastSeenLocation.lat;
            const lng = c.lastSeenLocation.lng;
            L.marker([lat, lng]).addTo(detailMapInstance)
                .bindPopup(`<b>${c.name}</b><br>Last seen here`).openPopup();
            detailMapInstance.setView([lat, lng], 12);
            document.getElementById("detailCoords").textContent =
                `📍 ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
        } else {
            document.getElementById("detailCoords").textContent = "No location data available.";
        }
    }, 100);

    // Show description if available
    const descWrap = document.getElementById("detailDescriptionWrap");
    const descEl = document.getElementById("detailDescription");
    if (c.description) {
        descEl.textContent = c.description;
        descWrap.classList.remove("hidden");
    } else {
        descWrap.classList.add("hidden");
    }

    // Wire up the Report Sighting button
    document.getElementById("addSightingBtn").onclick = () => openSightingModal(c._id, c.name);

    // Load sightings
    loadSightings(caseId);
}

function closeDetail() {
    document.getElementById("detailModal").style.display = "none";
    document.body.style.overflow = "";
    if (detailMapInstance) { detailMapInstance.remove(); detailMapInstance = null; }
}

async function loadSightings(caseId) {
    const list = document.getElementById("sightingsList");
    list.innerHTML = `<div class="text-xs text-gray-400 text-center py-6">Loading sightings...</div>`;
    try {
        const res = await fetch(`${API_BASE}/sightings/${caseId}`);
        const data = await res.json();
        if (!data.length) {
            list.innerHTML = `<div class="text-xs text-gray-400 text-center py-6">No sightings reported yet. Be the first to help!</div>`;
            return;
        }
        list.innerHTML = data.map(s => {
            const when = s.seenAt ? new Date(s.seenAt).toLocaleString() : new Date(s.createdAt).toLocaleString();
            const who = s.reporterName || "Anonymous";
            const locTxt = s.location?.lat
                ? `${Number(s.location.lat).toFixed(4)}, ${Number(s.location.lng).toFixed(4)}`
                : "Unknown";
            return `
            <div class="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                            ${who.charAt(0).toUpperCase()}
                        </div>
                        <span class="text-sm font-bold text-gray-800">${who}</span>
                    </div>
                    <span class="text-xs text-gray-400">${when}</span>
                </div>
                ${s.description ? `<p class="text-sm text-gray-600 mb-2">${s.description}</p>` : ''}
                ${s.image ? `<img src="${API_BASE}/static/${s.image}" class="w-full max-h-48 object-cover rounded-lg mb-2" onerror="this.style.display='none'">` : ''}
                <div class="flex items-center gap-1 text-xs text-red-500 font-semibold">
                    📍 ${locTxt}
                </div>
            </div>`;
        }).join("");
    } catch (err) {
        list.innerHTML = `<div class="text-xs text-red-400 text-center py-4">Failed to load sightings.</div>`;
    }
}

function openSightingModal(caseId, caseName) {
    currentSightingCaseId = caseId;
    document.getElementById("sightingCaseName").textContent = caseName;
    document.getElementById("sightingReporter").value = "";
    document.getElementById("sightingDate").value = new Date().toISOString().split("T")[0];
    document.getElementById("sightingTime").value = new Date().toTimeString().slice(0, 5);
    document.getElementById("sightingLat").value = "";
    document.getElementById("sightingLng").value = "";
    document.getElementById("sightingDesc").value = "";
    // Reset photo
    document.getElementById("sightingPhoto").value = "";
    document.getElementById("sightingPhotoPreviewWrap").classList.add("hidden");
    document.getElementById("sightingPhotoPrompt").classList.remove("hidden");
    document.getElementById("sightingModal").style.display = "flex";

    setTimeout(() => {
        if (sightingMapInstance) { sightingMapInstance.remove(); sightingMapInstance = null; sightingMarker = null; }
        sightingMapInstance = L.map("sightingMap").setView([20, 0], 2);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(sightingMapInstance);
        sightingMapInstance.on("click", function(e) {
            const { lat, lng } = e.latlng;
            document.getElementById("sightingLat").value = lat.toFixed(6);
            document.getElementById("sightingLng").value = lng.toFixed(6);
            if (sightingMarker) sightingMapInstance.removeLayer(sightingMarker);
            sightingMarker = L.marker([lat, lng]).addTo(sightingMapInstance);
        });
    }, 100);
}

function closeSighting() {
    document.getElementById("sightingModal").style.display = "none";
    if (sightingMapInstance) { sightingMapInstance.remove(); sightingMapInstance = null; sightingMarker = null; }
}

async function submitSighting() {
    const lat = document.getElementById("sightingLat").value;
    const lng = document.getElementById("sightingLng").value;
    const date = document.getElementById("sightingDate").value;
    const time = document.getElementById("sightingTime").value;

    if (!lat || !lng) { alert("Please click the map to set the sighting location."); return; }
    if (!date || !time) { alert("Please enter the date and time you saw the person."); return; }

    const payload = {
        caseId: currentSightingCaseId,
        description: document.getElementById("sightingDesc").value.trim() || null,
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        seenAt: `${date}T${time}:00`,
        reporterName: document.getElementById("sightingReporter").value.trim() || null
    };

    // Upload photo if provided
    const photoFile = document.getElementById("sightingPhoto").files[0];
    if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
        if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            payload.image = uploadData.filename;
        }
    }

    const btn = document.getElementById("sightingSubmitBtn");
    btn.textContent = "Submitting...";
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/sightings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeSighting();
            loadSightings(currentSightingCaseId);
            alert("Sighting reported! Thank you for helping.");
        } else {
            const err = await res.json();
            alert("Error: " + JSON.stringify(err));
        }
    } catch (err) {
        alert("Connection error. Is the API server running?");
        console.error(err);
    } finally {
        btn.textContent = "📍 Submit Sighting";
        btn.disabled = false;
    }
}

// ========== EDIT MODAL LOGIC ==========

let editMapInstance = null;
let editMarker = null;
let currentEditCaseId = null;

document.getElementById("editPhotoDropzone").onclick = () => {
    document.getElementById("editPhoto").click();
};

document.getElementById("editPhoto").addEventListener("change", function () {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById("editPhotoPreview").src = e.target.result;
        };
        reader.readAsDataURL(this.files[0]);
    }
});

function openEditModal(caseId) {
    const c = allCases.find(x => x._id === caseId);
    if (!c) return;
    currentEditCaseId = caseId;

    document.getElementById("editModalTitle").textContent = c.name;
    document.getElementById("editName").value = c.name;
    document.getElementById("editAge").value = c.age ?? "";
    document.getElementById("editLat").value = c.lastSeenLocation?.lat ?? "";
    document.getElementById("editLng").value = c.lastSeenLocation?.lng ?? "";

    const hasPhoto = c.photo && c.photo !== "default.jpg" && c.photo !== "test.jpg";
    document.getElementById("editPhotoPreview").src = hasPhoto
        ? `${API_BASE}/static/${c.photo}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=374151&color=fff&size=200&bold=true`;

    document.getElementById("editDescription").value = c.description ?? "";

    document.getElementById("editModal").style.display = "flex";
    document.body.style.overflow = "hidden";

    setTimeout(() => {
        if (editMapInstance) { editMapInstance.remove(); editMapInstance = null; editMarker = null; }
        const startLat = c.lastSeenLocation?.lat ?? 20;
        const startLng = c.lastSeenLocation?.lng ?? 0;
        const zoom = c.lastSeenLocation?.lat ? 11 : 2;
        editMapInstance = L.map("editMap").setView([startLat, startLng], zoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(editMapInstance);

        if (c.lastSeenLocation?.lat) {
            editMarker = L.marker([startLat, startLng]).addTo(editMapInstance);
        }

        editMapInstance.on("click", function (e) {
            const { lat, lng } = e.latlng;
            document.getElementById("editLat").value = lat.toFixed(6);
            document.getElementById("editLng").value = lng.toFixed(6);
            if (editMarker) editMapInstance.removeLayer(editMarker);
            editMarker = L.marker([lat, lng]).addTo(editMapInstance);
        });
    }, 100);
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
    document.body.style.overflow = "";
    if (editMapInstance) { editMapInstance.remove(); editMapInstance = null; editMarker = null; }
    document.getElementById("editPhoto").value = "";
}

async function submitEdit() {
    const btn = document.getElementById("editSubmitBtn");
    btn.textContent = "Saving...";
    btn.disabled = true;

    try {
        let photoFilename = null;
        const photoFile = document.getElementById("editPhoto").files[0];
        if (photoFile) {
            btn.textContent = "Uploading photo...";
            const formData = new FormData();
            formData.append("file", photoFile);
            const uploadRes = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
            if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                photoFilename = uploadData.filename;
            }
        }

        const lat = document.getElementById("editLat").value;
        const lng = document.getElementById("editLng").value;

        const payload = {};
        const name = document.getElementById("editName").value.trim();
        const age = document.getElementById("editAge").value;
        const description = document.getElementById("editDescription").value.trim();
        if (name) payload.name = name;
        if (age) payload.age = parseInt(age);
        if (photoFilename) payload.photo = photoFilename;
        if (lat && lng) payload.lastSeenLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
        if (description) payload.description = description;

        const res = await fetch(`${API_BASE}/cases/${currentEditCaseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const c = allCases.find(x => x._id === currentEditCaseId);
            if (c) {
                if (payload.name) c.name = payload.name;
                if (payload.age) c.age = payload.age;
                if (payload.photo) c.photo = payload.photo;
                if (payload.lastSeenLocation) c.lastSeenLocation = payload.lastSeenLocation;
                if (payload.description) c.description = payload.description;
            }
            closeEditModal();
            renderCases();
            alert("Case updated successfully ✅");
        } else {
            const err = await res.json();
            alert("Error: " + (err.error || JSON.stringify(err)));
        }
    } catch (err) {
        alert("Connection error. Is the API server running?");
        console.error(err);
    } finally {
        btn.textContent = "💾 Save Changes";
        btn.disabled = false;
    }
}

// ========== UNDO FOUND ==========

async function revertToMissing(caseId) {
    if (!confirm("Revert this case back to Missing?")) return;
    try {
        const res = await fetch(`${API_BASE}/cases/${caseId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "missing" })
        });
        const data = await res.json();
        if (res.ok) {
            const c = allCases.find(x => x._id === caseId);
            if (c) c.status = "missing";
            renderCases();
        } else {
            alert("Error: " + (data.error || "Could not update case."));
        }
    } catch (err) {
        alert("Connection error.");
        console.error(err);
    }
}

// ========== SEARCH RADIUS FILTER ==========

// Haversine formula: returns distance in km between two lat/lng points
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function applyRadiusFilter() {
    const lat = parseFloat(document.getElementById("radiusLat").value);
    const lng = parseFloat(document.getElementById("radiusLng").value);
    const km = parseFloat(document.getElementById("radiusKm").value);

    if (isNaN(lat) || isNaN(lng)) {
        alert("Please enter valid latitude and longitude, or use \"Use My Location\".");
        return;
    }

    radiusFilter = { lat, lng, km };
    radiusFilterActive = true;
    document.getElementById("clearRadiusBtn").classList.remove("hidden");
    renderCases();
}

function clearRadiusFilter() {
    radiusFilter = null;
    radiusFilterActive = false;
    document.getElementById("clearRadiusBtn").classList.add("hidden");
    document.getElementById("radiusMsg").classList.add("hidden");
    document.getElementById("radiusLat").value = "";
    document.getElementById("radiusLng").value = "";
    renderCases();
}

function useMyLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }
    navigator.geolocation.getCurrentPosition(
        function (pos) {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            document.getElementById("radiusLat").value = lat.toFixed(6);
            document.getElementById("radiusLng").value = lng.toFixed(6);
            const msg = document.getElementById("radiusMsg");
            msg.textContent = `📡 Location detected: ${lat.toFixed(4)}, ${lng.toFixed(4)} — click Search Nearby to filter.`;
            msg.classList.remove("hidden");
        },
        function () {
            alert("Could not get your location. Please allow location access or enter manually.");
        }
    );
}