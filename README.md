# 🚨 Seekr – Missing People Reporting System

Seekr is a real-time, community-driven web platform designed to help locate missing individuals faster using crowd-sourced data, live alerts, and map-based tracking.

---

## 🌟 Features

### 🧍 Case Management
- Create missing person cases
- View all active cases
- Track time since missing
- Priority scoring system

### 📍 Interactive Map
- Displays last seen locations
- Real-time case markers
- Built using OpenStreetMap + Leaflet

### 🚨 Real-Time Alerts
- Instant alerts when a new case is created
- Powered by WebSockets (Socket.IO)

### 👁️ Sightings System
- Public users can report sightings
- Add:
  - Description
  - Location (lat/lng)
  - Timestamp
- Linked to specific cases

### ⚡ Priority System
- Cases prioritized based on:
  - Time since missing
  - New sightings
- Helps focus urgent cases

---

## 🛠️ Tech Stack

### Backend
- FastAPI (Python)
- MongoDB (Database)
- Socket.IO (Real-time communication)

### Frontend
- HTML, CSS, JavaScript
- Leaflet.js (Maps)
- Tailwind CSS (UI styling)

---

## 📂 Project Structure

```

Missing_people_report/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── socket_manager.py
│   ├── models/
│   ├── routes/
│   └── utils/
│
├── frontend/
│   ├── index.html
│   ├── cases.html
│   ├── map.html
│   ├── report.html
│   ├── js/
│   └── css/
│
└── requirements.txt

````

---

## ⚙️ Setup Instructions

### 1️⃣ Backend Setup

```bash
cd backend
pip install -r ../requirements.txt
uvicorn main:socket_app --reload
````

Backend runs at:

```
http://127.0.0.1:8000
```

---

### 2️⃣ Frontend Setup

Use Live Server OR:

```bash
cd frontend
python -m http.server 5500
```

Open:

```
http://127.0.0.1:5500
```

---

## 📡 API Endpoints

### Cases

* `GET /cases`
* `POST /cases`
* `GET /cases/{case_id}`

### Sightings

* `POST /sightings`
* `GET /sightings/{case_id}`

---

## 🚀 Future Improvements

* Face recognition integration
* AI-based matching
* Admin dashboard
* Authentication system
* Image upload storage (Cloudinary / S3)

---

## 👨‍💻 Authors

* Laxman Mudigonda
