import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/LogWorkout.css';

const workoutTypes = [
  { value: 'run', label: '🏃 Running' },
  { value: 'cycle', label: '🚴 Cycling' },
  { value: 'lift', label: '🏋️ Weightlifting' },
  { value: 'swim', label: '🏊 Swimming' },
  { value: 'crossfit', label: '💪 CrossFit' },
  { value: 'hiit', label: '⚡ HIIT' },
  { value: 'yoga', label: '🧘 Yoga' },
  { value: 'other', label: '🎯 Other' }
];

const LogWorkout = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'run',
    title: '',
    date: new Date().toISOString().split('T')[0],
    duration: 30,
    distance: '',
    calories: '',
    averageHeartRate: '',
    maxHeartRate: '',
    pace: '',
    elevationGain: '',
    notes: '',
    perceivedEffort: 5,
    sleepQuality: 7
  });
  
  const [exercises, setExercises] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showExercises, setShowExercises] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      setError('Please select a CSV file');
    }
  };

  const handleCSVUpload = async () => {
    if (!file) {
      setError('Please select a CSV file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/workouts/upload/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(`Successfully imported ${response.data.count} workouts!`);
      setFile(null);
      document.getElementById('csv-upload').value = '';
      
      setTimeout(() => {
        navigate('/workouts');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload CSV file');
    } finally {
      setLoading(false);
    }
  };

  const addExercise = () => {
    setExercises([...exercises, {
      name: '',
      sets: 3,
      reps: 10,
      weight: 0,
      rpe: 7
    }]);
    setShowExercises(true);
  };

  const updateExercise = (index, field, value) => {
    const updatedExercises = [...exercises];
    updatedExercises[index][field] = field === 'name' ? value : parseFloat(value) || 0;
    setExercises(updatedExercises);
  };

  const removeExercise = (index) => {
    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const workoutData = {
        ...formData,
        duration: parseFloat(formData.duration) || 0,
        distance: formData.distance ? parseFloat(formData.distance) : 0,
        calories: formData.calories ? parseInt(formData.calories) : 0,
        averageHeartRate: formData.averageHeartRate ? parseInt(formData.averageHeartRate) : null,
        maxHeartRate: formData.maxHeartRate ? parseInt(formData.maxHeartRate) : null,
        pace: formData.pace ? parseFloat(formData.pace) : null,
        elevationGain: formData.elevationGain ? parseFloat(formData.elevationGain) : null,
        perceivedEffort: parseInt(formData.perceivedEffort),
        sleepQuality: parseInt(formData.sleepQuality),
        exercises: formData.type === 'lift' ? exercises : []
      };

      const response = await api.post('/workouts', workoutData);
      
      setSuccess('Workout logged successfully!');
      
      // Reset form
      setFormData({
        type: 'run',
        title: '',
        date: new Date().toISOString().split('T')[0],
        duration: 30,
        distance: '',
        calories: '',
        averageHeartRate: '',
        maxHeartRate: '',
        pace: '',
        elevationGain: '',
        notes: '',
        perceivedEffort: 5,
        sleepQuality: 7
      });
      setExercises([]);
      setShowExercises(false);
      
      setTimeout(() => {
        navigate('/workouts');
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to log workout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="log-workout">
      <div className="page-header">
        <h1>Log Workout</h1>
        <p>Record your training session details</p>
      </div>

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

      <div className="csv-upload-section">
        <div className="upload-card">
          <h3>📁 Import from CSV</h3>
          <p>Upload a CSV file with multiple workouts</p>
          <div className="upload-form">
            <input
              type="file"
              id="csv-upload"
              accept=".csv"
              onChange={handleFileChange}
              className="form-control"
            />
            <div className="upload-info">
              {file && (
                <div className="file-info">
                  <span>Selected: {file.name}</span>
                  <span>Size: {(file.size / 1024).toFixed(2)} KB</span>
                </div>
              )}
              <a 
                href="/sample-workouts.csv" 
                download 
                className="btn btn-secondary btn-sm"
              >
                Download Sample CSV
              </a>
            </div>
            <button
              type="button"
              onClick={handleCSVUpload}
              disabled={!file || loading}
              className="btn btn-primary"
            >
              {loading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </div>
        </div>
      </div>

      <div className="divider">
        <span>OR</span>
      </div>

      <div className="manual-entry-section">
        <h2>Manual Entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="col-6">
              <div className="form-group">
                <label>Workout Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  {workoutTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g., Morning Run, Leg Day, etc."
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="col-6">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label>Duration (minutes) *</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="form-control"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="col-4">
              <div className="form-group">
                <label>Distance (km)</label>
                <input
                  type="number"
                  name="distance"
                  value={formData.distance}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                />
              </div>
            </div>
            <div className="col-4">
              <div className="form-group">
                <label>Calories</label>
                <input
                  type="number"
                  name="calories"
                  value={formData.calories}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                  placeholder="Estimated calories"
                />
              </div>
            </div>
            <div className="col-4">
              <div className="form-group">
                <label>Pace (min/km)</label>
                <input
                  type="number"
                  name="pace"
                  value={formData.pace}
                  onChange={handleChange}
                  className="form-control"
                  min="2"
                  max="20"
                  step="0.1"
                  placeholder="Auto-calculated"
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="col-6">
              <div className="form-group">
                <label>Average Heart Rate (bpm)</label>
                <input
                  type="number"
                  name="averageHeartRate"
                  value={formData.averageHeartRate}
                  onChange={handleChange}
                  className="form-control"
                  min="40"
                  max="220"
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label>Max Heart Rate (bpm)</label>
                <input
                  type="number"
                  name="maxHeartRate"
                  value={formData.maxHeartRate}
                  onChange={handleChange}
                  className="form-control"
                  min="40"
                  max="220"
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="col-4">
              <div className="form-group">
                <label>Perceived Effort (1-10)</label>
                <input
                  type="range"
                  name="perceivedEffort"
                  value={formData.perceivedEffort}
                  onChange={handleChange}
                  className="form-control"
                  min="1"
                  max="10"
                />
                <div className="range-value">{formData.perceivedEffort}/10</div>
              </div>
            </div>
            <div className="col-4">
              <div className="form-group">
                <label>Sleep Quality (1-10)</label>
                <input
                  type="range"
                  name="sleepQuality"
                  value={formData.sleepQuality}
                  onChange={handleChange}
                  className="form-control"
                  min="1"
                  max="10"
                />
                <div className="range-value">{formData.sleepQuality}/10</div>
              </div>
            </div>
            <div className="col-4">
              <div className="form-group">
                <label>Elevation Gain (m)</label>
                <input
                  type="number"
                  name="elevationGain"
                  value={formData.elevationGain}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                />
              </div>
            </div>
          </div>

          {formData.type === 'lift' && (
            <div className="exercises-section">
              <div className="section-header">
                <h3>Exercises</h3>
                <button
                  type="button"
                  onClick={addExercise}
                  className="btn btn-secondary btn-sm"
                >
                  Add Exercise
                </button>
              </div>
              
              {showExercises && exercises.length === 0 ? (
                <div className="no-exercises">
                  <p>No exercises added yet. Click "Add Exercise" to start.</p>
                </div>
              ) : (
                exercises.map((exercise, index) => (
                  <div key={index} className="exercise-card">
                    <div className="exercise-header">
                      <h4>Exercise #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeExercise(index)}
                        className="btn btn-danger btn-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="exercise-form">
                      <div className="form-row">
                        <div className="col-6">
                          <input
                            type="text"
                            placeholder="Exercise name"
                            value={exercise.name}
                            onChange={(e) => updateExercise(index, 'name', e.target.value)}
                            className="form-control"
                          />
                        </div>
                        <div className="col-6">
                          <div className="form-row">
                            <div className="col-3">
                              <input
                                type="number"
                                placeholder="Sets"
                                value={exercise.sets}
                                onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                                className="form-control"
                                min="1"
                              />
                            </div>
                            <div className="col-3">
                              <input
                                type="number"
                                placeholder="Reps"
                                value={exercise.reps}
                                onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                                className="form-control"
                                min="1"
                              />
                            </div>
                            <div className="col-3">
                              <input
                                type="number"
                                placeholder="Weight"
                                value={exercise.weight}
                                onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                                className="form-control"
                                min="0"
                                step="0.5"
                              />
                            </div>
                            <div className="col-3">
                              <input
                                type="number"
                                placeholder="RPE"
                                value={exercise.rpe}
                                onChange={(e) => updateExercise(index, 'rpe', e.target.value)}
                                className="form-control"
                                min="1"
                                max="10"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="How did it feel? Any observations? Recovery notes..."
              maxLength="1000"
            />
            <div className="char-count">
              {formData.notes.length}/1000 characters
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm"></span>
                  Logging Workout...
                </>
              ) : 'Log Workout'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/workouts')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogWorkout;