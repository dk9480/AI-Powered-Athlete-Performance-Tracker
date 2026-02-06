import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LogWorkout from './pages/LogWorkout';
import Workouts from './pages/Workouts';
import Insights from './pages/Insights';
import TrainingPlan from './pages/TrainingPlan';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/log-workout" element={
                <PrivateRoute>
                  <LogWorkout />
                </PrivateRoute>
              } />
              <Route path="/workouts" element={
                <PrivateRoute>
                  <Workouts />
                </PrivateRoute>
              } />
              <Route path="/insights" element={
                <PrivateRoute>
                  <Insights />
                </PrivateRoute>
              } />
              <Route path="/training-plan" element={
                <PrivateRoute>
                  <TrainingPlan />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;