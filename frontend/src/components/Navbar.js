import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/">
            <h1>🏃 Athlete Training</h1>
          </Link>
        </div>

        {user ? (
          <div className="navbar-menu">
            <div className="navbar-links">
              <Link to="/" className="nav-link">
                Dashboard
              </Link>
              <Link to="/log-workout" className="nav-link">
                Log Workout
              </Link>
              <Link to="/workouts" className="nav-link">
                Workouts
              </Link>
              <Link to="/insights" className="nav-link">
                Insights
              </Link>
              <Link to="/training-plan" className="nav-link">
                Training Plan
              </Link>
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
            </div>
            <div className="navbar-user">
              <span className="user-name">Hi, {user.name}</span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="navbar-auth">
            <Link to="/login" className="btn btn-secondary">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary ml-2">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;