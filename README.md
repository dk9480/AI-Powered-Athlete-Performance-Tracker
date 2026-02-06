# 🏃‍♂️ Sports Performance Tracker with AI Insights

A full-stack web application that enables athletes to log workouts, analyze performance trends, receive AI-generated insights, and export training reports as PDFs.

This project demonstrates real-world backend logic, dynamic date filtering, AI integration, data visualization, and report generation.

---

## 🚀 Features

### 👤 Authentication
- User registration and login using JWT
- Secure protected APIs
- User profile management

### 🏋️ Workout Management
- Log workouts manually
- Bulk upload workouts using CSV files
- Supported workout types:
  - run, cycle, swim, lift, crossfit
- View workout history with:
  - Pagination
  - Date filters
  - Type filters
- Delete workouts

### 📊 Analytics & Visualization
- Dashboard overview:
  - Total workouts
  - Total duration
  - Total distance
- Interactive charts using Victory Charts
  - Workouts by type
- Dynamic statistics:
  - Last 7 / 30 / 90 days
  - Monthly summaries

### 🤖 AI Performance Insights
- AI-powered insights using Google Gemini API
- Analysis includes:
  - Training trends
  - Strengths & weaknesses
  - Recovery score
  - Injury risk indicators
  - Actionable recommendations
- Mock AI fallback when API key is not configured

### 📄 PDF Export
- Export workout logs as PDF
- Export personalized training plans as PDF
- Date-range–aware exports (respects selected filters)

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Victory Charts
- Axios
- CSS

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Multer (CSV uploads)
- jsPDF

### AI
- Google Gemini API

---

## 📂 Project Structure

## 📂 Project Structure

```text
athlete-training-app/
│
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & error handling middleware
│   ├── uploads/         # CSV uploads
│   ├── server.js        # Express server entry point
│   └── .env             # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── pages/       # Page-level components
│   │   ├── components/  # Reusable UI components
│   │   ├── utils/       # Helpers & API utilities
│   │   └── styles/      # CSS files
│
└── README.md


```

---

## 🧪 CSV Upload Format

Use this exact CSV header format:

```csv
type,title,date,duration,distance,calories,avgHR,maxHR,pace,notes
