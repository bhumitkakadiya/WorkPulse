<div align="center">
  <h1>🚀 WorkPulse</h1>
  <p><b>The Next-Generation Employee Productivity & Activity Tracking Suite</b></p>

  <p>
    <a href="https://mongodb.com"><img src="https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
    <a href="https://expressjs.com"><img src="https://img.shields.io/badge/Express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB" alt="Express.js" /></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License" /></a>
  </p>
  
  <p>
    WorkPulse is an enterprise-grade platform built to monitor team productivity, manage goals, facilitate communication, and provide deep analytics using a Gemini-powered AI Assistant. Featuring a stunning glassmorphism UI with a custom bluish slate dark mode.
  </p>
</div>

---

## ✨ Key Features

- **🔐 Enterprise RBAC**: Robust Custom Roles & Permissions (Admin, Manager, Employee).
- **⏱️ Activity Timeline**: Real-time, hour-by-hour color-coded daily view of employee productivity.
- **📈 Productivity Scoring**: Transparent analytics engine that intelligently categorizes applications and websites as productive, neutral, or distracting.
- **🎯 OKRs & Tasks**: Built-in cascading Goals, Objectives, and Team Task assignment workflows.
- **🏖️ Leave Management**: Streamlined system to request, review, and approve employee time-off requests.
- **💬 Real-Time Messaging**: Built-in team communication channels powered by Socket.io.
- **🤖 Pulse AI**: Native Google Gemini-powered AI assistant to query analytics, summarize team performance, and answer organizational questions.
- **🎨 Modern Aesthetics**: Beautiful, fully responsive UI featuring glassmorphism elements, subtle micro-animations, and a highly polished professional Dark Mode (Bluish Slate).

---

## 🏗️ Architecture

WorkPulse is distributed across three core isolated systems to ensure scalability and separation of concerns:

```text
workpulse/
├── backend/          # Node.js + Express API (MongoDB Atlas)
│   ├── src/          # Controllers, Models, Routes, & AI Services
│   └── .env          # Environment configuration
│
├── frontend/         # React + Vite Client Dashboard
│   ├── src/          # Pages, Components, Auth & Theme Contexts
│   └── index.css     # Global Design System & Variables
│
└── extension/        # Chrome Extension (Activity Tracker)
    ├── manifest.json # Chrome v3 Manifest
    └── background.js # Application tracking & screenshot logic
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites & API Keys
You will need the following free API keys to fully run WorkPulse locally:
1. **MongoDB Atlas** URI ([Get here](https://mongodb.com/cloud/atlas))
2. **Google Gemini** API Key ([Get here](https://aistudio.google.com))
3. **Cloudinary** API Keys for screenshot & avatar storage ([Get here](https://cloudinary.com))

### 2. Backend Setup
Navigate to the `backend` directory and set up the server:
```bash
cd backend
cp .env.example .env
# Fill in your .env variables (MONGO_URI, GEMINI_API_KEY, CLOUDINARY_URL, etc.)

npm install
npm run seed        # Seeds demo data (Users, Tasks, Activity)
npm run dev         # Starts development server on http://localhost:5000
```

### 3. Frontend Setup
Navigate to the `frontend` directory and spin up the Vite dashboard:
```bash
cd frontend
npm install
npm run dev         # Starts React dashboard on http://localhost:5173
```

---

## 🔑 Demo Accounts (Post-Seeding)

If you ran `npm run seed`, the database is populated with realistic test data. You can log in with the following accounts to explore the different RBAC views:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@workpulse.dev | `password123` | Full system settings, billing, & all users |
| **Manager** | manager@workpulse.dev | `password123` | Team oversight, approvals, & analytics |
| **Employee** | jordan@workpulse.dev | `password123` | Personal dashboard, tasks, & messages |

---

## 🚢 Deployment & Production

- **Backend (API)**: Deploy to platforms like [Render](https://render.com), Railway, or Heroku. Ensure the Root Directory is set to `backend` and inject your `.env` variables via the host's dashboard.
- **Frontend (Web)**: Deploy seamlessly to [Vercel](https://vercel.com) or Netlify. Set the Root Directory to `frontend` and the build command to `npm run build`.
- **Chrome Extension**: Zip the `extension` folder and upload it to the Chrome Web Store Developer Dashboard for organizational distribution.

---

<div align="center">
  <i>Built with ❤️ for modern engineering teams to foster productivity and well-being.</i>
</div>
