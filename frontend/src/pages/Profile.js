import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    athleteType: 'runner',
    fitnessLevel: 'intermediate',
    age: '',
    weight: '',
    height: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        athleteType: user.athleteType || 'runner',
        fitnessLevel: user.fitnessLevel || 'intermediate',
        age: user.age || '',
        weight: user.weight || '',
        height: user.height || ''
      });
    }
  }, [user]);

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
    setSuccess(null);

    try {
      // Filter out empty values
      const updateData = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== '')
      );

      const result = await updateProfile(updateData);
      
      if (result.success) {
        setSuccess('Profile updated successfully!');
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Your Profile</h1>
        <p>Manage your account and preferences</p>
      </div>

      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="user-card">
            <div className="user-avatar">
              {user.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="user-info">
              <h3>{user.name}</h3>
              <p className="user-email">{user.email}</p>
              <div className="user-tags">
                <span className="tag athlete-tag">{user.athleteType}</span>
                <span className="tag level-tag">{user.fitnessLevel}</span>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <h4>Account Stats</h4>
            <div className="stats-list">
              <div className="stat-item">
                <span className="stat-label">Member Since</span>
                <span className="stat-value">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Athlete Type</span>
                <span className="stat-value">{user.athleteType}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Fitness Level</span>
                <span className="stat-value">{user.fitnessLevel}</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h4>Profile Tips</h4>
            <ul className="tips-list">
              <li>Keep your profile updated for better AI insights</li>
              <li>Accurate metrics help generate personalized plans</li>
              <li>Regular updates improve training recommendations</li>
            </ul>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-form-section">
            <h2>Edit Profile</h2>
            
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}
            
            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="col-6">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-control"
                      required
                      disabled
                    />
                    <small className="form-help">Email cannot be changed</small>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="col-6">
                  <div className="form-group">
                    <label>Athlete Type</label>
                    <select
                      name="athleteType"
                      value={formData.athleteType}
                      onChange={handleChange}
                      className="form-control"
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
                    <label>Fitness Level</label>
                    <select
                      name="fitnessLevel"
                      value={formData.fitnessLevel}
                      onChange={handleChange}
                      className="form-control"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="elite">Elite</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="col-4">
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="form-control"
                      min="13"
                      max="100"
                    />
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      className="form-control"
                      min="30"
                      max="300"
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-group">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      className="form-control"
                      min="100"
                      max="250"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="spinner spinner-sm"></span>
                      Updating...
                    </>
                  ) : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

          <div className="preferences-section">
            <h2>Training Preferences</h2>
            <div className="preferences-grid">
              <div className="preference-card">
                <h4>Workout Schedule</h4>
                <p>Configure your preferred workout days and times</p>
                <button className="btn btn-secondary btn-sm">
                  Configure
                </button>
              </div>
              <div className="preference-card">
                <h4>Notification Settings</h4>
                <p>Set up workout reminders and progress alerts</p>
                <button className="btn btn-secondary btn-sm">
                  Configure
                </button>
              </div>
              <div className="preference-card">
                <h4>Data Privacy</h4>
                <p>Manage your data sharing preferences</p>
                <button className="btn btn-secondary btn-sm">
                  Configure
                </button>
              </div>
              <div className="preference-card">
                <h4>Export Data</h4>
                <p>Download all your workout data</p>
                <button className="btn btn-secondary btn-sm">
                  Export
                </button>
              </div>
            </div>
          </div>

          <div className="account-section">
            <h2>Account Management</h2>
            <div className="account-actions">
              <button className="btn btn-secondary">
                Change Password
              </button>
              <button className="btn btn-secondary ml-2">
                Delete Account
              </button>
              <button className="btn btn-danger ml-2">
                Logout All Devices
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;