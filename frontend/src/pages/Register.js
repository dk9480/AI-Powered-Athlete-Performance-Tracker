import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    athleteType: 'runner',
    fitnessLevel: 'intermediate',
    age: '',
    weight: '',
    height: ''
  });
  
  const [loading, setLoading] = useState(false);
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Prepare data for API
    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      athleteType: formData.athleteType,
      fitnessLevel: formData.fitnessLevel,
      age: formData.age ? parseInt(formData.age) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      height: formData.height ? parseInt(formData.height) : undefined
    };

    const result = await register(userData);
    
    if (result.success) {
      navigate('/');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join our athlete community</p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Enter your full name"
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Create a password"
                  minLength="6"
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-control"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Confirm your password"
                  minLength="6"
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="athleteType">Athlete Type</label>
                <select
                  id="athleteType"
                  name="athleteType"
                  className="form-control"
                  value={formData.athleteType}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="runner">Runner</option>
                  <option value="cyclist">Cyclist</option>
                  <option value="weightlifter">Weightlifter</option>
                  <option value="crossfit">CrossFit</option>
                  <option value="swimmer">Swimmer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="fitnessLevel">Fitness Level</label>
                <select
                  id="fitnessLevel"
                  name="fitnessLevel"
                  className="form-control"
                  value={formData.fitnessLevel}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="elite">Elite</option>
                </select>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-4">
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  className="form-control"
                  value={formData.age}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Age"
                  min="13"
                  max="100"
                />
              </div>
            </div>
            <div className="col-4">
              <div className="form-group">
                <label htmlFor="weight">Weight (kg)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  className="form-control"
                  value={formData.weight}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Weight"
                  min="30"
                  max="300"
                  step="0.1"
                />
              </div>
            </div>
            <div className="col-4">
              <div className="form-group">
                <label htmlFor="height">Height (cm)</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  className="form-control"
                  value={formData.height}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Height"
                  min="100"
                  max="250"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner spinner-sm"></span>
                Creating Account...
              </>
            ) : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
          <p className="mt-1">
            <Link to="/" className="auth-link">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;