<div align="center">
  <img src="https://via.placeholder.com/150x150/0f172a/0ea5e9?text=W" alt="WorkPulse Logo" width="100" height="100">
  
  # WorkPulse 🚀
  
  **The Next-Generation Employee Productivity & Activity Tracking Suite**
  
  [![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge&logo=mongodb)](https://mongodb.com)
  [![Vite React](https://img.shields.io/badge/Frontend-Vite%20+%20React-blueviolet?style=for-the-badge&logo=vite)](https://vitejs.dev)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

  <p align="center">
    WorkPulse is a comprehensive, enterprise-grade platform designed to monitor team productivity, track time and activity, manage leave requests and goals, and provide deep analytics using a Gemini-powered AI Assistant.
  </p>
</div>

---

## ✨ Features

- **🔐 Enterprise RBAC**: Fine-grained Custom Roles & Permissions (Admin, Manager, Employee).
- **⏱️ Activity Timeline**: Real-time, hour-by-hour color-coded day view of productivity.
- **📈 Productivity Scoring**: Transparent analytics engine categorizing apps as productive, neutral, or distracting.
- **🎯 OKRs & Tasks**: Built-in cascading Goals, Objectives, and Team Task assignment.
- **🏖️ Leave Management**: Request, review, and approve employee time-off requests.
- **💬 Real-Time Messaging**: Built-in team communication channels.
- **🤖 Pulse AI**: Native Google Gemini-powered AI assistant to query analytics and team performance.
- **🎨 Modern Glassmorphism UI**: Beautiful, fully responsive Dark/Light mode design system.

---

## 🏗️ Architecture

WorkPulse is split into three core isolated systems:

```text
workpulse/
├── backend/          # Node.js + Express API (MongoDB Atlas)
│   ├── src/          # Controllers, Models, Routes, & AI Services
│   └── .env          # Environment configuration
│
├── frontend/         # React + Vite Client Dashboard
│   ├── src/          # Pages, Components, Auth & Theme Contexts
│   └── index.css     # Global Design System
│
└── extension/        # Chrome Extension (Activity Tracker)
    ├── manifest.json # Chrome v3 Manifest
    └── background.js # Application tracking logic
```

---

## 🚀 Quick Start Guide

### 1. Database & APIs
You will need the following free API keys to run WorkPulse:
1. **MongoDB Atlas** URI ([Get here](https://mongodb.com/cloud/atlas))
2. **Google Gemini** API Key ([Get here](https://aistudio.google.com))
3. **Cloudinary** API Keys for image storage ([Get here](https://cloudinary.com))

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your .env variables (MONGO_URI, GEMINI_API_KEY, Cloudinary)

npm install
npm run seed        # Seeds demo data (Users, Tasks, Activity)
npm run dev         # Starts server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev         # Starts dashboard on http://localhost:5173
```

---

## 🔑 Demo Accounts (Post-Seeding)

If you ran `npm run seed`, you can log in with the following accounts to test the RBAC system:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@workpulse.dev | `password123` |
| **Manager** | manager@workpulse.dev | `password123` |
| **Employee** | jordan@workpulse.dev | `password123` |

---

## 🚢 Deployment

- **Backend**: Deploy to [Render](https://render.com) or Heroku. Set the Root Directory to `backend` and add your `.env` variables.
- **Frontend**: Deploy to [Vercel](https://vercel.com) or Netlify. Set the Root Directory to `frontend`.
- **Extension**: Upload the `.zip` file of the `extension` folder to the Chrome Web Store Developer Dashboard.

---

<div align="center">
  <i>Built with ❤️ for modern engineering teams.</i>
</div>
