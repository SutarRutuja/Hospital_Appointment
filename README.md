# ENT Clinic Hospital Appointment System

A complete hospital appointment system designed for a specialty ENT clinic. 

## Features
- **3 Roles**: Patient, Doctor, Admin.
- **Backend**: Node.js, Express, MongoDB (Native Driver), JWT Auth, atomic booking checks to prevent double booking.
- **Frontend**: High-end Vanilla HTML/CSS/JS (No frameworks), responsive UI, glassmorphism, completely isolated from backend templates using REST.

## Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/en/) installed.
- [MongoDB](https://www.mongodb.com/) installed and running locally on port 27017.

### 2. Run Backend
1. Open a terminal and navigate to the `backend` folder.
   ```bash
   cd backend
   ```
2. Check the `.env` file (already created) ensuring it connects to `mongodb://localhost:27017` and runs on port `5000`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   node server.js
   ```
   *You should see `Server running on port 5000` and `MongoDB connected`*.


### 3. Run Frontend
The frontend does not require a build step. You can simply serve it via a static file server like `Live Server` in VS Code or `http-server`:
1. Navigate to the `frontend` folder.
2. Run `npx http-server` or simply open `frontend/index.html` in your web browser.

Enjoy testing the ENT Specialty Clinic!
