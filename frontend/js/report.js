console.log("REPORT JS LOADED");

let locationMarker = null;
let reportMap = null;
let otpVerified = false;
const MOCK_OTP = "1234"; // Demo OTP - replace with real SMS service in production

// ---- VERIFICATION MODAL ----
function sendOtp() {
    const phone = document.getElementById("verifyPhone").value.trim();
    const err = document.getElementById("otpError");
    if (!/^[6-9]\d{9}$/.test(phone)) {
        err.textContent = "Enter a valid 10-digit Indian mobile number.";
        err.classList.remove("hidden");
        return;
    }
    err.classList.add("hidden");
    document.getElementById("otpPhoneDisplay").textContent = phone;
    document.getElementById("verifyStep1").classList.add("hidden");
    document.getElementById("verifyStep2").classList.remove("hidden");
}

function completeVerification() {
    const otp = document.getElementById("otpInput").value.trim();
    const checked = document.getElementById("verifyCheck").checked;
    const otpErr = document.getElementById("otpVerifyError");

    if (!document.getElementById("verifyStep2").classList.contains("hidden")) {
        if (otp !== MOCK_OTP) {
            otpErr.textContent = "Incorrect OTP. Please try again. (Demo OTP: 1234)";
            otpErr.classList.remove("hidden");
            return;
        }
        otpErr.classList.add("hidden");
    } else {
        alert("Please enter your phone number and verify OTP first.");
        return;
    }

    if (!checked) {
        alert("Please confirm this is a genuine report by checking the checkbox.");
        return;
    }

    otpVerified = true;
    document.getElementById("verifyModal").style.display = "none";
    document.body.style.overflow = "";
}

// Show modal on page load
window.addEventListener("DOMContentLoaded", function () {
    document.body.style.overflow = "hidden";
    document.getElementById("verifyModal").style.display = "block";
});

function initLocationMap() {
    if (typeof L === "undefined") return;
    reportMap = L.map("locationMap").setView([17.385, 78.4867], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(reportMap);

    reportMap.on("click", function (e) {
        const { lat, lng } = e.latlng;
        document.getElementById("lat").value = lat.toFixed(6);
        document.getElementById("lng").value = lng.toFixed(6);
        if (locationMarker) reportMap.removeLayer(locationMarker);
        locationMarker = L.marker([lat, lng]).addTo(reportMap);
    });
}

document.getElementById("photoDropzone").onclick = () => {
    document.getElementById("photo").click();
};

function previewPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            const preview = document.getElementById("photoPreview");
            preview.src = e.target.result;
            preview.classList.remove("hidden");
        };
        reader.readAsDataURL(input.files[0]);
    }
}

document.getElementById("photo").addEventListener("change", function () {
    previewPhoto(this);
});

async function submitCase() {
    if (!otpVerified) {
        alert("Please verify your phone number first.");
        return;
    }

    const name = document.getElementById("name").value.trim();
    const age = document.getElementById("age").value;
    const lat = document.getElementById("lat").value;
    const lng = document.getElementById("lng").value;

    if (!name) {
        alert("Please enter the person's full name.");
        return;
    }
    if (!lat || !lng) {
        alert("Please click the map to set a last known location.");
        return;
    }

    const btn = document.getElementById("submitBtn");
    btn.textContent = "Uploading photo...";
    btn.disabled = true;

    let photoFilename = "default.jpg";
    const photoFile = document.getElementById("photo").files[0];
    if (photoFile) {
        try {
            const formData = new FormData();
            formData.append("file", photoFile);
            const uploadRes = await fetch(`${API_BASE}/upload`, {
                method: "POST",
                body: formData
            });
            if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                photoFilename = uploadData.filename;
            }
        } catch (err) {
            console.warn("Photo upload failed, using default:", err);
        }
    }

    const description = document.getElementById("description").value.trim();

    const payload = {
        name: name,
        age: age ? parseInt(age) : null,
        photo: photoFilename,
        lastSeenLocation: {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        },
        description: description || null
    };

    btn.textContent = "Submitting case...";

    try {
        const res = await fetch(`${API_BASE}/cases`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (res.ok) {
            alert("Case Submitted Successfully ✅\nAuthorities have been alerted.");
            window.location.href = "cases.html";
        } else {
            alert("Error: " + JSON.stringify(result));
            btn.textContent = "🚨 Submit Report →";
            btn.disabled = false;
        }
    } catch (err) {
        console.error("Submit error:", err);
        alert("Connection error. Is the API server running?");
        btn.textContent = "🚨 Submit Report →";
        btn.disabled = false;
    }
}

initLocationMap();