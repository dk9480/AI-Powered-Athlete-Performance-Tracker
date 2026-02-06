import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/TrainingPlan.css';

const TrainingPlan = () => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    goal: 'Improve overall fitness and endurance',
    durationWeeks: 4,
    intensity: 'moderate',
    focus: 'balanced'
  });
  const [generatedPlan, setGeneratedPlan] = useState(null);

  useEffect(() => {
    const savedPlan = localStorage.getItem('trainingPlan');
    if (savedPlan) {
      setPlan(JSON.parse(savedPlan));
    }
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'durationWeeks' ? parseInt(value) : value
    }));
  };

  const generatePlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/ai/training-plan', formData);
      const newPlan = response.data;
      setGeneratedPlan(newPlan);
      setPlan(newPlan);
      localStorage.setItem('trainingPlan', JSON.stringify(newPlan));
    } catch (error) {
      console.error('Error generating plan:', error);
      setError('Failed to generate training plan');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!plan) {
      alert('Please generate a training plan first');
      return;
    }

    try {
      const response = await api.post('/pdf/training-plan', {
        planData: plan
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

  const WeekCard = ({ week }) => {
    return (
      <div className="week-card">
        <div className="week-header">
          <h3>Week {week.weekNumber}</h3>
          <span className="week-focus">{week.focus}</span>
        </div>
        
        <div className="week-meta">
          <div className="meta-item">
            <span className="label">Total Volume:</span>
            <span className="value">{week.totalVolume}</span>
          </div>
          <div className="meta-item">
            <span className="label">Goals:</span>
            <div className="goals-list">
              {week.goals?.map((goal, idx) => (
                <span key={idx} className="goal-tag">{goal}</span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="week-schedule">
          <h4>Daily Schedule</h4>
          <div className="schedule-grid">
            {Object.entries(week.days || {}).map(([day, workout]) => (
              <div key={day} className="day-slot">
                <div className="day-header">
                  <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                  <span className="workout-type">{workout.workoutType}</span>
                </div>
                <div className="workout-details">
                  <div className="detail">
                    <span className="label">Duration:</span>
                    <span className="value">{workout.duration}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Intensity:</span>
                    <span className="value">{workout.intensity}/10</span>
                  </div>
                  {workout.description && (
                    <div className="detail full-width">
                      <span className="label">Description:</span>
                      <span className="value">{workout.description}</span>
                    </div>
                  )}
                  {workout.keyFocus && (
                    <div className="detail full-width">
                      <span className="label">Focus:</span>
                      <span className="value">{workout.keyFocus}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {week.recoveryStrategies && week.recoveryStrategies.length > 0 && (
          <div className="recovery-section">
            <h4>Recovery Strategies</h4>
            <ul className="recovery-list">
              {week.recoveryStrategies.map((strategy, idx) => (
                <li key={idx}>{strategy}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="training-plan-page">
      <div className="page-header">
        <h1>Training Plan Generator</h1>
        <p>Create personalized workout schedules with AI</p>
      </div>

      <div className="plan-generator-section">
        <div className="generator-card">
          <h2>Create Your Plan</h2>
          
          <div className="generator-form">
            <div className="form-row">
              <div className="col-6">
                <div className="form-group">
                  <label>Training Goal *</label>
                  <textarea
                    name="goal"
                    value={formData.goal}
                    onChange={handleFormChange}
                    className="form-control"
                    rows="3"
                    placeholder="Describe your fitness goals..."
                    required
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="form-row">
                  <div className="col-6">
                    <div className="form-group">
                      <label>Duration (weeks)</label>
                      <select
                        name="durationWeeks"
                        value={formData.durationWeeks}
                        onChange={handleFormChange}
                        className="form-control"
                      >
                        <option value="2">2 weeks</option>
                        <option value="4">4 weeks</option>
                        <option value="6">6 weeks</option>
                        <option value="8">8 weeks</option>
                        <option value="12">12 weeks</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label>Intensity</label>
                      <select
                        name="intensity"
                        value={formData.intensity}
                        onChange={handleFormChange}
                        className="form-control"
                      >
                        <option value="light">Light</option>
                        <option value="moderate">Moderate</option>
                        <option value="hard">Hard</option>
                        <option value="very-hard">Very Hard</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Focus Area</label>
                  <select
                    name="focus"
                    value={formData.focus}
                    onChange={handleFormChange}
                    className="form-control"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="strength">Strength</option>
                    <option value="endurance">Endurance</option>
                    <option value="speed">Speed</option>
                    <option value="recovery">Recovery</option>
                    <option value="competition">Competition Prep</option>
                  </select>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}
            
            <div className="form-actions">
              <button
                onClick={generatePlan}
                disabled={loading}
                className="btn btn-primary btn-lg"
              >
                {loading ? (
                  <>
                    <span className="spinner spinner-sm"></span>
                    Generating Plan...
                  </>
                ) : 'Generate Training Plan'}
              </button>
              
              {plan && (
                <button
                  onClick={downloadPDF}
                  className="btn btn-success ml-2"
                >
                  📄 Download PDF
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {plan && (
        <div className="plan-preview-section">
          <div className="plan-header">
            <div className="header-content">
              <h2>{plan.planTitle}</h2>
              <div className="plan-meta">
                <div className="meta-item">
                  <span className="label">Goal:</span>
                  <span className="value">{plan.goal}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Duration:</span>
                  <span className="value">{plan.durationWeeks} weeks</span>
                </div>
                <div className="meta-item">
                  <span className="label">Intensity:</span>
                  <span className="value">{plan.intensityLevel}</span>
                </div>
              </div>
            </div>
            <div className="header-actions">
              <button
                onClick={() => window.print()}
                className="btn btn-secondary"
              >
                🖨️ Print Plan
              </button>
            </div>
          </div>

          {plan.progressionStrategy && (
            <div className="progression-section">
              <h3>Progression Strategy</h3>
              <p>{plan.progressionStrategy}</p>
            </div>
          )}

          {plan.performanceMetrics && plan.performanceMetrics.length > 0 && (
            <div className="metrics-section">
              <h3>Performance Metrics</h3>
              <div className="metrics-grid">
                {plan.performanceMetrics.map((metric, index) => (
                  <div key={index} className="metric-card">
                    <div className="metric-number">{index + 1}</div>
                    <p>{metric}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="weeks-section">
            <h3>Weekly Schedule</h3>
            <div className="weeks-container">
              {plan.weeks?.map((week, index) => (
                <WeekCard key={index} week={week} />
              ))}
            </div>
          </div>

          {plan.notes && (
            <div className="notes-section">
              <h3>Important Notes</h3>
              <div className="notes-card">
                <p>{plan.notes}</p>
              </div>
            </div>
          )}

          <div className="plan-footer">
            <p className="disclaimer">
              <strong>Disclaimer:</strong> This training plan is generated by AI and should be used as a guide. 
              Always listen to your body and consult with a healthcare professional before starting any new 
              exercise program. Adjust the plan based on your individual needs and recovery.
            </p>
            <div className="footer-actions">
              <button
                onClick={downloadPDF}
                className="btn btn-primary"
              >
                📄 Download Full Plan (PDF)
              </button>
              <button
                onClick={() => setPlan(null)}
                className="btn btn-secondary ml-2"
              >
                Clear Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {!plan && !loading && (
        <div className="no-plan-section">
          <div className="placeholder-card">
            <h3>No Training Plan Generated Yet</h3>
            <p>
              Use the form above to create your personalized training plan. 
              Our AI will analyze your goals and create a customized schedule.
            </p>
            <div className="placeholder-features">
              <div className="feature">
                <div className="feature-icon">🎯</div>
                <h4>Goal-Oriented</h4>
                <p>Plans tailored to your specific objectives</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📊</div>
                <h4>AI-Powered</h4>
                <p>Intelligent recommendations based on best practices</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📱</div>
                <h4>Printable</h4>
                <p>Download as PDF for offline access</p>
              </div>
              <div className="feature">
                <div className="feature-icon">⚡</div>
                <h4>Progressive</h4>
                <p>Gradual intensity increase for optimal results</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingPlan;