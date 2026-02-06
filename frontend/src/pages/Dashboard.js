import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  VictoryBar, 
  VictoryChart, 
  VictoryTheme, 
  VictoryAxis, 
  VictoryLine,
  VictoryTooltip
} from 'victory';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    overview: {
      totalWorkouts: 0,
      totalDuration: 0,
      totalDistance: 0,
      totalCalories: 0
    },
    weeklyActivity: [],
    byType: [],
    recentProgress: []
  });
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching dashboard data...');

      const [statsRes, workoutsRes] = await Promise.all([
        api.get('/workouts/stats/overview', {
          params: { period: '30d' }
        }),
        api.get('/workouts', {
          params: { limit: 5 }
        })
      ]);

      console.log('📊 Stats API Response:', statsRes.data);
      console.log('🏃 Workouts API Response:', workoutsRes.data);

      // Check if stats data exists
      if (statsRes.data && statsRes.data.overview) {
        setStats(statsRes.data);
        console.log('✅ Stats loaded successfully');
      } else {
        console.log('⚠️ No stats data in response');
        setStats({
          overview: {
            totalWorkouts: 0,
            totalDuration: 0,
            totalDistance: 0,
            totalCalories: 0
          },
          weeklyActivity: [],
          byType: [],
          recentProgress: []
        });
      }

      // Check if workouts data exists
      if (workoutsRes.data && workoutsRes.data.workouts) {
        setRecentWorkouts(workoutsRes.data.workouts);
        console.log(`✅ Loaded ${workoutsRes.data.workouts.length} recent workouts`);
      } else {
        setRecentWorkouts([]);
        console.log('⚠️ No workouts data in response');
      }

    } catch (error) {
      console.error('❌ Dashboard fetch error:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      
      setError('Failed to load dashboard data. Please try again.');
      
      // Set default data on error
      setStats({
        overview: {
          totalWorkouts: 0,
          totalDuration: 0,
          totalDistance: 0,
          totalCalories: 0
        },
        weeklyActivity: [],
        byType: [],
        recentProgress: []
      });
      setRecentWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };



  // CHART DATA FIX 
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const weeklyChartData = stats.weeklyActivity.map(item => ({
  ...item,
  dayLabel: days[item._id - 1] || item._id
}));

const recentProgressData = stats.recentProgress.map((item, index) => ({
  ...item,
  indexLabel: index + 1
}));



  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name}!</h1>
        <p className="subtitle">Track your progress and optimize your training</p>
        
        {/* Refresh button */}
        <button 
          onClick={fetchDashboardData}
          className="btn btn-primary btn-sm mt-2"
          style={{ background: '#007bff', color: 'white', border: 'none' }}
        >
          🔄 Refresh Dashboard
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Debug Info - Shows what's loaded */}
      <div style={{ 
        background: '#f0f8ff', 
        padding: '10px', 
        borderRadius: '5px', 
        marginBottom: '20px',
        border: '1px solid #007bff',
        fontSize: '14px'
      }}>
        <p style={{ margin: 0 }}>
          <strong>📊 Dashboard Info:</strong> 
          <span style={{ marginLeft: '10px' }}>
            Workouts: <strong>{stats.overview.totalWorkouts}</strong> | 
            Duration: <strong>{formatDuration(stats.overview.totalDuration)}</strong> | 
            Distance: <strong>{stats.overview.totalDistance ? stats.overview.totalDistance.toFixed(1) : '0.0'} km</strong>
          </span>
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
          Showing {recentWorkouts.length} recent workouts | 
          Check console (F12) for detailed logs
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏃</div>
          <div className="stat-content">
            <h3>Total Workouts</h3>
            <p className="stat-number" style={{ color: '#007bff', fontSize: '2.2rem' }}>
              {stats.overview.totalWorkouts}
            </p>
            <p className="stat-subtitle">Last 30 days</p>
            <small style={{ color: '#666' }}>
              {recentWorkouts.length} shown below
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>Total Duration</h3>
            <p className="stat-number" style={{ color: '#28a745', fontSize: '2.2rem' }}>
              {formatDuration(stats.overview.totalDuration)}
            </p>
            <p className="stat-subtitle">Active time</p>
            <small style={{ color: '#666' }}>
              Raw: {stats.overview.totalDuration} min
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📏</div>
          <div className="stat-content">
            <h3>Total Distance</h3>
            <p className="stat-number" style={{ color: '#ff6b35', fontSize: '2.2rem' }}>
              {stats.overview.totalDistance ? stats.overview.totalDistance.toFixed(1) : '0.0'}
            </p>
            <p className="stat-subtitle">Kilometers</p>
            <small style={{ color: '#666' }}>
              Average: {stats.overview.totalWorkouts > 0 ? 
                (stats.overview.totalDistance / stats.overview.totalWorkouts).toFixed(1) : '0.0'} km/workout
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>Calories Burned</h3>
            <p className="stat-number" style={{ color: '#dc3545', fontSize: '2.2rem' }}>
              {stats.overview.totalCalories ? stats.overview.totalCalories.toLocaleString() : '0'}
            </p>
            <p className="stat-subtitle">Total energy</p>
            <small style={{ color: '#666' }}>
              Average: {stats.overview.totalWorkouts > 0 ? 
                Math.round(stats.overview.totalCalories / stats.overview.totalWorkouts) : '0'} cal/workout
            </small>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Weekly Activity</h3>
          {stats.weeklyActivity && stats.weeklyActivity.length > 0 ? (
            <VictoryChart
              theme={VictoryTheme.material}
              domainPadding={15}
              height={220}
            >


            <VictoryAxis
              label="Day of Week"
              style={{
                axisLabel: { padding: 26, fontSize: 12 }
              }}
              tickFormat={(tick) => tick}
            />

            <VictoryAxis
              dependentAxis
              label="Number of Workouts"
              style={{
                axisLabel: { padding: 40, fontSize: 12 }
              }}
            />




            <VictoryBar
                data={weeklyChartData}
                x="dayLabel"
                y="count"
                style={{
                  data: { fill: "#007bff", width: 20 }
                }}
                labels={({ datum }) => `${datum.count} workouts`}
                labelComponent={<VictoryTooltip />}
              />
            </VictoryChart>
          ) : (
            <div className="no-data">
              <p>No weekly activity data yet</p>
              <Link to="/log-workout" className="btn btn-primary btn-sm">
                Log your first workout
              </Link>
            </div>
          )}
        </div>

        <div className="chart-card">
          <h3>Recent Performance Trend</h3>
          {stats.recentProgress && stats.recentProgress.length > 1 ? (
            <VictoryChart
              theme={VictoryTheme.material}
              domainPadding={15}

              height={220}
              padding={{ top: 30, bottom: 60, left: 70, right: 30 }}

            >


            <VictoryAxis
              label="Workout Session Order"
              tickValues={recentProgressData.map(d => d.indexLabel)}
              tickFormat={(t) => `#${t}`}
              style={{
                axisLabel: { padding: 32, fontSize: 12 }
              }}
            />


            <VictoryAxis
              dependentAxis
              label="Distance (km)"
              style={{
                axisLabel: { padding: 45, fontSize: 12 }
              }}
            />



            <VictoryLine
                data={recentProgressData}
                x="indexLabel"
                y="distance"
                style={{
                  data: { stroke: "#28a745", strokeWidth: 3 }
                }}
                interpolation="natural"
              />
            </VictoryChart>
          ) : (
            <div className="no-data">
              <p>Need more workouts for trend analysis</p>
              <button 
                onClick={fetchDashboardData}
                className="btn btn-secondary btn-sm"
              >
                Check Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RECENT WORKOUTS */}
      <div className="recent-section">
        <div className="section-header">
          <h2>Recent Workouts ({recentWorkouts.length})</h2>
          <Link to="/workouts" className="btn btn-secondary btn-sm">
            View All
          </Link>
        </div>

        {recentWorkouts.length > 0 ? (
          <div className="workouts-grid">
            {recentWorkouts.map(workout => (
              <div key={workout._id} className="workout-card">
                <div className="workout-header">
                  <span className={`workout-type ${workout.type}`}>
                    {workout.type}
                  </span>
                  <span className="workout-date">
                    {new Date(workout.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="workout-body">
                  <div className="workout-stat">
                    <span className="stat-label">Duration</span>
                    <span className="stat-value">{workout.duration} min</span>
                  </div>
                  {workout.distance > 0 && (
                    <div className="workout-stat">
                      <span className="stat-label">Distance</span>
                      <span className="stat-value">{workout.distance} km</span>
                    </div>
                  )}
                  {workout.calories > 0 && (
                    <div className="workout-stat">
                      <span className="stat-label">Calories</span>
                      <span className="stat-value">{workout.calories}</span>
                    </div>
                  )}
                  {workout.pace > 0 && (
                    <div className="workout-stat">
                      <span className="stat-label">Pace</span>
                      <span className="stat-value">{workout.pace.toFixed(1)} min/km</span>
                    </div>
                  )}
                </div>
                {workout.notes && (
                  <div className="workout-notes">
                    <p>{workout.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-workouts">
            <p>No workouts logged yet</p>
            <Link to="/log-workout" className="btn btn-primary">
              Log Your First Workout
            </Link>
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/log-workout" className="action-card">
            <div className="action-icon">➕</div>
            <h3>Log Workout</h3>
            <p>Record your training session</p>
          </Link>
          
          <Link to="/insights" className="action-card">
            <div className="action-icon">📊</div>
            <h3>Get Insights</h3>
            <p>AI-powered analysis</p>
          </Link>
          
          <Link to="/training-plan" className="action-card">
            <div className="action-icon">📋</div>
            <h3>Training Plan</h3>
            <p>Generate workout schedule</p>
          </Link>
          
          <Link to="/profile" className="action-card">
            <div className="action-icon">👤</div>
            <h3>Profile</h3>
            <p>Update your information</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;