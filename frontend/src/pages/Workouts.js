import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis } from 'victory';
import '../styles/Workouts.css';

const Workouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  useEffect(() => {
    fetchWorkouts();
    fetchStats();
  }, [filters]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        ...filters,
        page: filters.page,
        limit: filters.limit
      };

      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await api.get('/workouts', { params });
      setWorkouts(response.data.workouts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      setError('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/workouts/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
    window.scrollTo(0, 0);
  };

  const deleteWorkout = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workout?')) {
      return;
    }

    try {
      await api.delete(`/workouts/${id}`);
      setWorkouts(workouts.filter(w => w._id !== id));
      fetchStats();
    } catch (error) {
      console.error('Error deleting workout:', error);
      alert('Failed to delete workout');
    }
  };

  const exportToPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.type) params.append('type', filters.type);

      const response = await api.get(`/pdf/workout-log?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `workout-log-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading && workouts.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading workouts...</span>
      </div>
    );
  }

  return (
    <div className="workouts-page">
      <div className="page-header">
        <h1>Workout History</h1>
        <p>Track and analyze your training sessions</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="workouts-overview">
        <div className="overview-card">
          <h3>📈 Overview</h3>
          <div className="overview-stats">
            <div className="stat-item">
              <span className="stat-label">Total Workouts</span>
              <span className="stat-value">{stats?.overview?.totalWorkouts || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Duration</span>
              <span className="stat-value">{formatDuration(stats?.overview?.totalDuration || 0)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Distance</span>
              <span className="stat-value">{stats?.overview?.totalDistance?.toFixed(1) || 0} km</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg. Duration</span>
              <span className="stat-value">{stats?.overview ? (stats.overview.totalDuration / stats.overview.totalWorkouts).toFixed(0) : 0} min</span>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Workouts by Type</h3>
          {stats?.byType?.length > 0 ? (
            <VictoryChart
              theme={VictoryTheme.material}
              domainPadding={20}
              height={200}
              padding={{ top: 30, bottom: 50, left: 70, right: 30 }}

            >

            <VictoryAxis
              label="Workout Type"
              tickFormat={stats.byType.map(t => t._id)}
              style={{
                axisLabel: { padding: 35, fontSize: 12 }
              }}
            />

            <VictoryAxis
              dependentAxis
              label="Number of Workouts"
              style={{
                axisLabel: { padding: 45, fontSize: 12 }
              }}
            />



            <VictoryBar
                data={stats.byType}
                x="_id"
                y="count"
                style={{
                  data: { fill: "#28a745" }
                }}
              />
            </VictoryChart>
          ) : (
            <div className="no-data">
              <p>No workout type data available</p>
            </div>
          )}
        </div>
      </div>

      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filter-form">
          <div className="form-row">
            <div className="col-3">
              <div className="form-group">
                <label>Type</label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="form-control"
                >
                  <option value="">All Types</option>
                  <option value="run">Running</option>
                  <option value="cycle">Cycling</option>
                  <option value="lift">Weightlifting</option>
                  <option value="swim">Swimming</option>
                  <option value="crossfit">CrossFit</option>
                </select>
              </div>
            </div>
            <div className="col-3">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
            </div>
            <div className="col-3">
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
            </div>
            <div className="col-3">
              <div className="form-group">
                <label>Results per page</label>
                <select
                  name="limit"
                  value={filters.limit}
                  onChange={handleFilterChange}
                  className="form-control"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          </div>
          <div className="filter-actions">
            <button
              onClick={exportToPDF}
              className="btn btn-primary"
            >
              📄 Export to PDF
            </button>
            <button
              onClick={() => setFilters({
                type: '',
                startDate: '',
                endDate: '',
                page: 1,
                limit: 10
              })}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="workouts-list">
        <div className="list-header">
          <h3>Workouts ({pagination.total || 0})</h3>
          <div className="results-info">
            Showing {((filters.page - 1) * filters.limit) + 1} to{' '}
            {Math.min(filters.page * filters.limit, pagination.total || 0)} of{' '}
            {pagination.total || 0} workouts
          </div>
        </div>

        {workouts.length === 0 ? (
          <div className="no-workouts">
            <p>No workouts found. Try adjusting your filters or log a new workout!</p>
          </div>
        ) : (
          <>
            <div className="workouts-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Duration</th>
                    <th>Distance</th>
                    <th>Calories</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workouts.map(workout => (
                    <tr key={workout._id}>
                      <td>{formatDate(workout.date)}</td>
                      <td>
                        <span className={`workout-type-badge ${workout.type}`}>
                          {workout.type}
                        </span>
                      </td>
                      <td>{workout.title || 'No title'}</td>
                      <td>{workout.duration} min</td>
                      <td>{workout.distance ? `${workout.distance} km` : '-'}</td>
                      <td>{workout.calories || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => setSelectedWorkout(workout)}
                            className="btn btn-sm btn-secondary"
                          >
                            View
                          </button>
                          <button
                            onClick={() => deleteWorkout(workout._id)}
                            className="btn btn-sm btn-danger ml-1"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (filters.page <= 3) {
                      pageNum = i + 1;
                    } else if (filters.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = filters.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`btn btn-sm ${filters.page === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === pagination.pages}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Workout Detail Modal */}
      {selectedWorkout && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Workout Details</h3>
              <button
                onClick={() => setSelectedWorkout(null)}
                className="btn btn-sm btn-secondary"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="workout-detail">
                <div className="detail-header">
                  <h4>{selectedWorkout.title || `${selectedWorkout.type} Workout`}</h4>
                  <span className="workout-date">
                    {new Date(selectedWorkout.date).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="detail-stats">
                  <div className="stat-row">
                    <span className="stat-label">Type:</span>
                    <span className="stat-value">{selectedWorkout.type}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Duration:</span>
                    <span className="stat-value">{selectedWorkout.duration} minutes</span>
                  </div>
                  {selectedWorkout.distance > 0 && (
                    <div className="stat-row">
                      <span className="stat-label">Distance:</span>
                      <span className="stat-value">{selectedWorkout.distance} km</span>
                    </div>
                  )}
                  {selectedWorkout.pace > 0 && (
                    <div className="stat-row">
                      <span className="stat-label">Pace:</span>
                      <span className="stat-value">{selectedWorkout.pace.toFixed(1)} min/km</span>
                    </div>
                  )}
                  {selectedWorkout.calories > 0 && (
                    <div className="stat-row">
                      <span className="stat-label">Calories:</span>
                      <span className="stat-value">{selectedWorkout.calories}</span>
                    </div>
                  )}
                  {selectedWorkout.averageHeartRate > 0 && (
                    <div className="stat-row">
                      <span className="stat-label">Avg HR:</span>
                      <span className="stat-value">{selectedWorkout.averageHeartRate} bpm</span>
                    </div>
                  )}
                  {selectedWorkout.perceivedEffort > 0 && (
                    <div className="stat-row">
                      <span className="stat-label">Perceived Effort:</span>
                      <span className="stat-value">{selectedWorkout.perceivedEffort}/10</span>
                    </div>
                  )}
                </div>
                
                {selectedWorkout.notes && (
                  <div className="detail-notes">
                    <h5>Notes</h5>
                    <p>{selectedWorkout.notes}</p>
                  </div>
                )}
                
                {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 && (
                  <div className="detail-exercises">
                    <h5>Exercises</h5>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Exercise</th>
                          <th>Sets</th>
                          <th>Reps</th>
                          <th>Weight</th>
                          <th>RPE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedWorkout.exercises.map((exercise, index) => (
                          <tr key={index}>
                            <td>{exercise.name}</td>
                            <td>{exercise.sets}</td>
                            <td>{exercise.reps}</td>
                            <td>{exercise.weight} kg</td>
                            <td>{exercise.rpe}/10</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setSelectedWorkout(null)}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;