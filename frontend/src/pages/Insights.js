import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  VictoryLine, 
  VictoryChart, 
  VictoryTheme, 
  VictoryAxis,
  VictoryTooltip,
  VictoryScatter
} from 'victory';
import '../styles/Insights.css';

const Insights = () => {
  const [insights, setInsights] = useState(null);
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [goal, setGoal] = useState('Improve overall fitness and endurance');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/ai/insights', { period });
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateTrainingPlan = async () => {
    try {
      setPlanLoading(true);
      const response = await api.post('/ai/training-plan', {
        goal,
        durationWeeks: 4,
        intensity: 'moderate'
      });
      setTrainingPlan(response.data);
    } catch (error) {
      console.error('Error generating training plan:', error);
      alert('Failed to generate training plan');
    } finally {
      setPlanLoading(false);
    }
  };

  const downloadPlanPDF = async () => {
    if (!trainingPlan) {
      alert('Please generate a training plan first');
      return;
    }

    try {
      const response = await api.post('/pdf/training-plan', {
        planData: trainingPlan
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `training-plan-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    }
  };

  const PerformanceScore = ({ score, label }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 10) * circumference;
    
    return (
      <div className="score-circle">
        <svg width="100" height="100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#007bff"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
          />
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dy=".3em"
            fontSize="20"
            fontWeight="bold"
            fill="#333"
          >
            {score.toFixed(1)}
          </text>
        </svg>
        <div className="score-label">{label}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Analyzing your training data with AI...</span>
      </div>
    );
  }

  return (
    <div className="insights-page">
      <div className="page-header">
        <h1>AI Performance Insights</h1>
        <p>Get personalized analysis and recommendations</p>
      </div>

      <div className="period-selector">
        <div className="selector-buttons">
          <button
            className={`period-btn ${period === '7d' ? 'active' : ''}`}
            onClick={() => setPeriod('7d')}
          >
            Last 7 Days
          </button>
          <button
            className={`period-btn ${period === '30d' ? 'active' : ''}`}
            onClick={() => setPeriod('30d')}
          >
            Last 30 Days
          </button>
          <button
            className={`period-btn ${period === '90d' ? 'active' : ''}`}
            onClick={() => setPeriod('90d')}
          >
            Last 90 Days
          </button>
        </div>
        <button
          onClick={fetchInsights}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {insights ? (
        <>
          <div className="insights-summary">
            <div className="summary-card">
              <h3>AI Analysis Summary</h3>
              <p className="summary-text">{insights.summary}</p>
              
              <div className="score-grid">
                <PerformanceScore 
                  score={insights.performanceScore || 7} 
                  label="Performance" 
                />
                <PerformanceScore 
                  score={insights.recoveryScore || 7} 
                  label="Recovery" 
                />
                <PerformanceScore 
                  score={insights.consistencyScore || 7} 
                  label="Consistency" 
                />
                <PerformanceScore 
                  score={insights.progressScore || 7} 
                  label="Progress" 
                />
              </div>
            </div>

            <div className="stats-card">
              <h3>Training Statistics</h3>
              {insights.calculatedStats && (
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Workouts</span>
                    <span className="stat-value">{insights.calculatedStats.totalWorkouts}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Duration</span>
                    <span className="stat-value">{insights.calculatedStats.totalDuration} min</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Distance</span>
                    <span className="stat-value">{insights.calculatedStats.totalDistance} km</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Period</span>
                    <span className="stat-value">{insights.calculatedStats.periodDays} days</span>
                  </div>
                </div>
              )}
              <div className="stats-period">
                Generated: {new Date(insights.generatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="insights-details">
            <div className="trends-card">
              <h3>📈 Performance Trends</h3>
              {insights.performanceTrends && insights.performanceTrends.length > 0 ? (
                <ul className="insights-list">
                  {insights.performanceTrends.map((trend, index) => (
                    <li key={index}>{trend}</li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">No trend data available</p>
              )}
            </div>

            <div className="strengths-card">
              <h3>✅ Strengths</h3>
              {insights.strengths && insights.strengths.length > 0 ? (
                <ul className="insights-list">
                  {insights.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">No strength data available</p>
              )}
            </div>

            <div className="improvements-card">
              <h3>🎯 Areas for Improvement</h3>
              {insights.weaknesses && insights.weaknesses.length > 0 ? (
                <ul className="insights-list">
                  {insights.weaknesses.map((weakness, index) => (
                    <li key={index}>{weakness}</li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">No improvement data available</p>
              )}
            </div>
          </div>

          <div className="recommendations-section">
            <h2>💡 AI Recommendations</h2>
            {insights.recommendations && insights.recommendations.length > 0 ? (
              <div className="recommendations-grid">
                {insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="recommendation-card">
                    <div className="rec-number">{index + 1}</div>
                    <p>{recommendation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No recommendations available</p>
            )}
          </div>

          {insights.injuryRisks && insights.injuryRisks.length > 0 && (
            <div className="injury-section">
              <h2>⚠️ Injury Prevention</h2>
              <div className="injury-grid">
                {insights.injuryRisks.map((risk, index) => (
                  <div key={index} className="injury-card">
                    <p>{risk}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.nextSteps && (
            <div className="next-steps-section">
              <h2>🚀 Next Steps</h2>
              <div className="next-steps-grid">
                <div className="next-step-card">
                  <h4>Short Term (Next 2 Weeks)</h4>
                  <p>{insights.nextSteps.shortTerm}</p>
                </div>
                <div className="next-step-card">
                  <h4>Medium Term (Next Month)</h4>
                  <p>{insights.nextSteps.mediumTerm}</p>
                </div>
                <div className="next-step-card">
                  <h4>Long Term (Next 3 Months)</h4>
                  <p>{insights.nextSteps.longTerm}</p>
                </div>
              </div>
            </div>
          )}

          <div className="training-plan-section">
            <h2>📋 Personalized Training Plan</h2>
            <div className="plan-generator">
              <div className="goal-input">
                <label>Your Goal</label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="form-control"
                  placeholder="Describe your training goal..."
                />
              </div>
              <div className="plan-actions">
                <button
                  onClick={generateTrainingPlan}
                  disabled={planLoading}
                  className="btn btn-primary"
                >
                  {planLoading ? 'Generating...' : 'Generate 4-Week Plan'}
                </button>
                {trainingPlan && (
                  <button
                    onClick={downloadPlanPDF}
                    className="btn btn-success ml-2"
                  >
                    📄 Download PDF
                  </button>
                )}
              </div>
            </div>

            {trainingPlan && (
              <div className="plan-preview">
                <h3>{trainingPlan.planTitle}</h3>
                <div className="plan-meta">
                  <span>Goal: {trainingPlan.goal}</span>
                  <span>Duration: {trainingPlan.durationWeeks} weeks</span>
                  <span>Intensity: {trainingPlan.intensityLevel}</span>
                </div>

                <div className="weeks-grid">
                  {trainingPlan.weeks?.slice(0, 2).map((week, index) => (
                    <div key={index} className="week-card">
                      <h4>Week {week.weekNumber}: {week.focus}</h4>
                      <div className="week-goals">
                        <strong>Goals:</strong>
                        <ul>
                          {week.goals?.map((goal, idx) => (
                            <li key={idx}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="week-schedule">
                        {Object.entries(week.days || {}).map(([day, workout]) => (
                          <div key={day} className="day-workout">
                            <strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong>
                            <span>{workout.workoutType}</span>
                            <span>{workout.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {trainingPlan.notes && (
                  <div className="plan-notes">
                    <h5>Notes</h5>
                    <p>{trainingPlan.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="no-insights">
          <p>No insights available. Generate AI analysis to see your personalized recommendations.</p>
          <button
            onClick={fetchInsights}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Generate AI Insights'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Insights;