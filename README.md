# 🧠 AI Voice Assistant

A lightweight voice assistant with a Python FastAPI backend and a React (Vite) frontend. Supports voice commands, weather queries, jokes, system actions, and wake-word interaction.

## Project structure
project/
├── backend/          # FastAPI server
│   ├── main.py
│   ├── assistant.py
│   ├── weather.py
│   └── requirements.txt
└── frontend/
    └── vite-project/ # React + Vite app

---

## Prerequisites
- Python 3.9+
- Node 16+ / npm
- Git
- Microphone and a Chromium-based browser with Web Speech API support (Chrome/Edge)

---

## Backend (FastAPI)

1. Open terminal and go to backend:
```sh
cd backend
```

2. Create & activate virtual environment

Windows (PowerShell/CMD):
```ps1
python -m venv venv
venv\Scripts\activate
```

macOS / Linux:
```sh
python -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```sh
pip install -r requirements.txt
```

4. Start backend (from backend/):
```sh
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Or if you run from repo root:
```sh
uvicorn backend.main:app --reload --port 8000
```

The backend will be available at: http://127.0.0.1:8000

Note: If you enable CORS in backend, ensure the frontend origin (http://localhost:5173) is allowed.

---

## Frontend (React + Vite)

1. Open a new terminal and go to frontend:
```sh
cd frontend/vite-project
```

2. Install packages:
```sh
npm install
```

3. Start dev server:
```sh
npm run dev
```

Frontend dev server runs at: http://localhost:5173

To build for production:
```sh
npm run build
```
Serve the `dist/` folder (you can serve static files via backend or any static host).

---

## Running both locally
1. Start backend (terminal A): run uvicorn on port 8000.
2. Start frontend (terminal B): `npm run dev`.
3. Open the frontend URL in browser, allow microphone access.

Windows quick PowerShell example (two shells):
```ps1
# Shell 1
cd backend; venv\Scripts\activate; uvicorn main:app --reload

# Shell 2
cd frontend\vite-project; npm install; npm run dev
```

---

## API
POST /query
Request JSON:
```json
{ "text": "open youtube" }
```
Response JSON:
```json
{ "response": "Opening YouTube" }
```

Quick curl example:
```sh
curl -X POST http://127.0.0.1:8000/query -H "Content-Type: application/json" -d '{"text":"tell me a joke"}'
```

---

## Usage
1. Start backend and frontend.
2. Open the app, grant microphone permission.
3. Use wake word (e.g., "Hey Assistant") or press Speak Command.
4. Try commands:
   - "What's the weather in Mumbai?"
   - "Tell me a joke"
   - "Open YouTube"

---

## Troubleshooting
- No microphone prompt: make sure site is served over HTTPS or localhost and browser has mic permissions.
- SpeechRecognition unsupported: try Chrome/Edge.
- CORS errors: add `http://localhost:5173` to backend allowed origins.

## Requirements (backend/requirements.txt)
- fastapi
- uvicorn
- pydantic
- requests
- pyjokes
