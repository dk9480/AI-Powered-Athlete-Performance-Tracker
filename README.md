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
```
### Notes
- Only valid workout types are accepted
- Invalid types (for example: `yoga`) are rejected by backend validation
- Date format must be **YYYY-MM-DD**


## 📸 Demo Screenshots

All demo screenshots are stored in the following folder:


Click on any item below to view the full screenshot.

### 🖼️ Application Flow Screenshots

- [📝 User Registration](screenshots/01-register.png)
- [🔐 User Login](screenshots/02-login.png)
- [📊 Dashboard Overview](screenshots/03-dashboard_FullPage.png)
- [📤 CSV Upload / Manual Entry](screenshots/04-csv-upload_OR_ManualENTRY.png)
- [📋 Workout History Table](screenshots/05-workout-list.png)
- [📈 Charts Visualization](screenshots/06-charts.png)
- [📄 PDF Export Output](screenshots/07-pdf-export.png)

### 🤖 AI Insights Screenshots

- [AI Insights – Page 1](screenshots/08-ai-insights_1ST_HalfPage.png)
- [AI Insights – Page 2](screenshots/08-ai-insights_2nd_MiddlePage.png)
- [AI Insights – Page 3](screenshots/08-ai-insights_3rd_LastPage.png)

### 🧠 Training Plan PDF Screenshots

- [Training Plan – Page 1](screenshots/09-Training_Plan_1st.png)
- [Training Plan – Page 2](screenshots/09-Training_Plan_2nd.png)
- [Training Plan – Page 3](screenshots/09-Training_Plan_3rd.png)
- [Training Plan – Page 4](screenshots/09-Training_Plan_4st.png)

### 🗄️ Database Screenshots

- [MongoDB Users Collection](screenshots/12_DB_Users.png)
- [MongoDB Workouts Collection](screenshots/11_DB_Workouts.png)

### 👤 Profile

- [Profile Update Screen](screenshots/10-ProfileUpdate.png)

👉 Click any link above to open the screenshot directly in GitHub.


## 🔁 Date Filtering Logic (Important)

- Workout dates represent when the activity actually occurred and remain fixed.
- Views and exports are **dynamic** and depend on:
  - Selected start and end date
  - “Last 30 days” logic calculated using the current system date
- PDF exports always respect the selected filters.

This makes the application **future-proof and production-ready**.

## ⚙️ Environment Setup

Create a `.env` file inside the `backend` folder:

```env
PORT=5000
MONGODB_URI=your_mongodb_url
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key


```

## ▶️ Running the Project Locally

### Backend
```bash
cd backend
npm install
npm start

``` 
### Frontend
```bash
cd frontend
npm install
npm start
```
### Local URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:5000


## 🧠 What This Project Demonstrates

- Full-stack web development
- Secure authentication & authorization
- RESTful API design
- File uploads and validation
- AI integration with fallback logic
- Data visualization and analytics
- Production-style filtering and reporting

## 👨‍💻 Author

**D K VIJENDRA KUMAR**  
B.Tech Student  
Full-Stack Development | AI/ML | Data-Driven Applications





