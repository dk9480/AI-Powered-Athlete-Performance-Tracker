const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Workout = require('../models/Workout');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini AI with error handling
let genAI;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✅ Gemini AI initialized');
  } else {
    console.log('⚠️  GEMINI_API_KEY not found in .env');
  }
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI:', error.message);
}

// Test route to verify AI route is working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'AI route is working!',
    geminiKey: process.env.GEMINI_API_KEY ? 'Set' : 'Not set',
    timestamp: new Date().toISOString()
  });
});

// Get AI performance insights
router.post('/insights', auth, async (req, res) => {
  try {
    console.log('AI insights request received');
    
    // Check if Gemini is initialized
    if (!genAI) {
      return res.status(503).json({
        error: 'AI service not available',
        message: 'Gemini API key not configured. Please set GEMINI_API_KEY in .env file.',
        mockData: true
      });
    }
    
    const { period = '30d' } = req.body;
    
    // Get user profile
    const user = await User.findById(req.user.id).select('-password');
    
    // Get workout data
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const workouts = await Workout.find({
      userId: req.user.id,
      date: { $gte: startDate }
    }).sort({ date: 1 }).lean();
    
    if (workouts.length === 0) {
      return res.status(404).json({ 
        error: 'No workout data found for the selected period',
        suggestion: 'Log some workouts first'
      });
    }
    
    // Calculate some basic statistics
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalDistance = workouts.reduce((sum, w) => sum + (w.distance || 0), 0);
    const avgDuration = totalDuration / totalWorkouts;
    const avgDistance = totalDistance / totalWorkouts;
    
    // Group by week for trend analysis
    const weeklyData = {};
    workouts.forEach(workout => {
      const weekStart = new Date(workout.date);
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          workouts: 0,
          duration: 0,
          distance: 0,
          intensity: 0
        };
      }
      
      weeklyData[weekKey].workouts++;
      weeklyData[weekKey].duration += workout.duration || 0;
      weeklyData[weekKey].distance += workout.distance || 0;
      weeklyData[weekKey].intensity += workout.perceivedEffort || 5;
    });
    
    // Prepare data for AI
    const workoutSummary = workouts.slice(-20).map(w => ({
      date: w.date.toISOString().split('T')[0],
      type: w.type,
      duration: w.duration,
      distance: w.distance || null,
      calories: w.calories || null,
      avgHR: w.averageHeartRate || null,
      pace: w.pace ? w.pace.toFixed(2) : null,
      perceivedEffort: w.perceivedEffort || null,
      notes: w.notes ? w.notes.substring(0, 100) : ''
    }));
    
    const statistics = {
      totalWorkouts,
      totalDuration: Math.round(totalDuration),
      totalDistance: totalDistance.toFixed(2),
      avgDuration: avgDuration.toFixed(1),
      avgDistance: avgDistance.toFixed(2),
      periodDays: days
    };
    
    // Try to use Gemini AI, fallback to mock data if fails
    try {
      // Prepare prompt for Gemini
      const prompt = `
      You are an expert athletic coach and sports scientist. Analyze the following training data and provide comprehensive insights.

      ATHLETE PROFILE:
      - Type: ${user.athleteType}
      - Fitness Level: ${user.fitnessLevel}
      - Age: ${user.age || 'Not specified'}
      - Weight: ${user.weight || 'Not specified'} kg
      - Height: ${user.height || 'Not specified'} cm

      TRAINING PERIOD: Last ${days} days
      TOTAL WORKOUTS: ${totalWorkouts}
      TOTAL DURATION: ${Math.round(totalDuration)} minutes
      TOTAL DISTANCE: ${totalDistance.toFixed(2)} km

      RECENT WORKOUTS (last 20):
      ${JSON.stringify(workoutSummary, null, 2)}

      WEEKLY TREND DATA:
      ${JSON.stringify(Object.entries(weeklyData).slice(-4), null, 2)}

      Please provide a detailed analysis with the following sections:

      1. PERFORMANCE TRENDS:
      - Identify patterns in training frequency, duration, and intensity
      - Note any improvements or declines
      - Highlight consistency level

      2. RECOVERY ANALYSIS:
      - Assess workout spacing and rest periods
      - Identify signs of overtraining or undertraining
      - Provide recovery score (1-10)

      3. STRENGTHS & WEAKNESSES:
      - List 3 key strengths in current training
      - List 3 areas needing improvement

      4. RECOMMENDATIONS:
      - Provide 5 specific, actionable recommendations
      - Include adjustments to training load
      - Suggest workout modifications

      5. INJURY PREVENTION:
      - Identify potential injury risks
      - Provide 3 preventive measures

      6. PERFORMANCE SCORE:
      - Overall performance score (1-10)
      - Consistency score (1-10)
      - Progress score (1-10)

      7. NEXT STEPS:
      - Short-term focus (next 2 weeks)
      - Medium-term goals (next month)
      - Long-term direction

      Format your response as a valid JSON object with these keys:
      - summary (string: brief overview)
      - performanceTrends (array of strings)
      - recoveryScore (number 1-10)
      - strengths (array of strings)
      - weaknesses (array of strings)
      - recommendations (array of strings)
      - injuryRisks (array of strings)
      - performanceScore (number 1-10)
      - consistencyScore (number 1-10)
      - progressScore (number 1-10)
      - nextSteps (object with shortTerm, mediumTerm, longTerm strings)
      `;
      
      // Call Gemini API
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse response
      let insights;
      try {
        // Extract JSON from markdown if present
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0].replace(/```json\n|\n```/g, '') : text;
        insights = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        insights = createMockInsights(workouts, statistics, period, user);
      }
      
      // Add calculated statistics
      insights.calculatedStats = statistics;
      insights.period = period;
      insights.generatedAt = new Date().toISOString();
      insights.aiGenerated = true;
      
      res.json(insights);
      
    } catch (geminiError) {
      console.error('Gemini API error, using mock data:', geminiError.message);
      
      // Return mock insights as fallback
      const mockInsights = createMockInsights(workouts, statistics, period, user);
      res.json(mockInsights);
    }
    
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI insights',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to create mock insights
function createMockInsights(workouts, statistics, period, user) {
  const workoutTypes = [...new Set(workouts.map(w => w.type))];
  const recentWorkouts = workouts.slice(-5);
  
  return {
    summary: `Based on your ${statistics.periodDays} days of training data, you've completed ${statistics.totalWorkouts} workouts totaling ${statistics.totalDuration} minutes. Your primary activities include ${workoutTypes.join(', ')}.`,
    performanceTrends: [
      `Consistent ${workoutTypes[0] || 'training'} frequency`,
      `Average workout duration: ${statistics.avgDuration} minutes`,
      `${workouts.length >= 5 ? 'Good' : 'Improving'} workout regularity`
    ],
    recoveryScore: workouts.length > 10 ? 6 : 8,
    strengths: [
      "Commitment to regular training",
      "Variety in workout types",
      "Consistent logging of workouts"
    ],
    weaknesses: [
      "Could benefit from more structured training plan",
      "Consider tracking nutrition for optimal performance",
      "Incorporate more recovery-focused activities"
    ],
    recommendations: [
      "Add 2 strength training sessions per week",
      "Increase weekly training volume by 10% gradually",
      "Include one active recovery day",
      "Track sleep quality and aim for 7-8 hours",
      "Consider setting specific performance goals"
    ],
    injuryRisks: [
      "Watch for overuse injuries with high frequency",
      "Ensure proper warm-up before intense sessions",
      "Listen to your body and adjust when needed"
    ],
    performanceScore: workouts.length > 5 ? 7.5 : 6.5,
    consistencyScore: workouts.length > 8 ? 8 : 7,
    progressScore: 7,
    nextSteps: {
      shortTerm: "Focus on consistency for the next 2 weeks",
      mediumTerm: "Increase intensity gradually over the next month",
      longTerm: "Set a specific goal like running a 10k or improving strength metrics"
    },
    calculatedStats: statistics,
    period: period,
    generatedAt: new Date().toISOString(),
    aiGenerated: false,
    note: "Using mock data. Add GEMINI_API_KEY to .env for AI-powered insights."
  };
}

// Generate personalized training plan
router.post('/training-plan', auth, async (req, res) => {
  try {
    console.log('Training plan request received');
    
    // Check if Gemini is initialized
    if (!genAI) {
      // Return mock training plan
      const user = await User.findById(req.user.id).select('-password');
      const mockPlan = createMockTrainingPlan(user, req.body);
      return res.json(mockPlan);
    }
    
    const { 
      goal = 'Improve overall fitness',
      durationWeeks = 4,
      intensity = 'moderate',
      focus = 'balanced'
    } = req.body;
    
    // Get user profile
    const user = await User.findById(req.user.id).select('-password');
    
    // Get recent workout history
    const recentWorkouts = await Workout.find({
      userId: req.user.id,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
    .sort({ date: -1 })
    .limit(20)
    .lean();
    
    // Prepare training data for AI
    const trainingHistory = recentWorkouts.map(w => ({
      date: w.date.toISOString().split('T')[0],
      type: w.type,
      duration: w.duration,
      distance: w.distance || null,
      intensity: w.perceivedEffort || 5
    }));
    
    // Prepare prompt for Gemini
    const prompt = `
    Create a personalized ${durationWeeks}-week training plan for an athlete.

    ATHLETE INFORMATION:
    - Type: ${user.athleteType}
    - Fitness Level: ${user.fitnessLevel}
    - Age: ${user.age || 'Not specified'}
    - Goal: ${goal}
    - Training Intensity Preference: ${intensity}
    - Focus Area: ${focus}

    RECENT TRAINING HISTORY (last 30 days):
    ${JSON.stringify(trainingHistory, null, 2)}

    Please create a detailed ${durationWeeks}-week training plan with:

    1. Weekly Structure: Each week should have:
       - Weekly focus/theme
       - Specific goals for the week
       - Recommended total volume
    
    2. Daily Workouts: For each day (Monday-Sunday), specify:
       - Workout type
       - Duration (minutes)
       - Intensity (RPE 1-10)
       - Specific exercises/activities
       - Key focus points
    
    3. Progression: How the plan progresses week-to-week
    
    4. Recovery: Built-in recovery strategies
    
    5. Performance Metrics: How to measure progress

    Format the response as a valid JSON object with this structure:
    {
      "planTitle": "string",
      "goal": "string",
      "durationWeeks": number,
      "intensityLevel": "string",
      "weeks": [
        {
          "weekNumber": 1,
          "focus": "string",
          "goals": ["string"],
          "totalVolume": "string",
          "days": {
            "monday": {
              "workoutType": "string",
              "duration": "string",
              "intensity": "string",
              "description": "string",
              "keyFocus": "string"
            },
            // ... repeat for tuesday through sunday
          },
          "recoveryStrategies": ["string"]
        }
        // ... repeat for each week
      ],
      "progressionStrategy": "string",
      "performanceMetrics": ["string"],
      "notes": "string"
    }
    `;
    
    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse response
    let trainingPlan;
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0].replace(/```json\n|\n```/g, '') : text;
      trainingPlan = JSON.parse(jsonString);
      trainingPlan.aiGenerated = true;
    } catch (parseError) {
      console.error('Failed to parse training plan:', parseError);
      trainingPlan = createMockTrainingPlan(user, req.body);
    }
    
    // Add metadata
    trainingPlan.generatedFor = user._id;
    trainingPlan.generatedAt = new Date().toISOString();
    trainingPlan.athleteType = user.athleteType;
    trainingPlan.fitnessLevel = user.fitnessLevel;
    
    res.json(trainingPlan);
    
  } catch (error) {
    console.error('Training plan error:', error);
    res.status(500).json({ 
      error: 'Failed to generate training plan',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to create mock training plan
function createMockTrainingPlan(user, options) {
  const { goal = 'Improve overall fitness', durationWeeks = 4, intensity = 'moderate' } = options;
  
  const plan = {
    planTitle: `${user.athleteType.charAt(0).toUpperCase() + user.athleteType.slice(1)} Training Plan`,
    goal: goal,
    durationWeeks: durationWeeks,
    intensityLevel: intensity,
    weeks: [],
    progressionStrategy: "Linear progression with 10% weekly volume increase",
    performanceMetrics: ["Workout completion rate", "Duration consistency", "Perceived effort (RPE)", "Recovery quality"],
    notes: "This is a mock training plan. Add GEMINI_API_KEY to .env for AI-generated personalized plans.",
    aiGenerated: false,
    generatedFor: user._id,
    generatedAt: new Date().toISOString(),
    athleteType: user.athleteType,
    fitnessLevel: user.fitnessLevel
  };
  
  // Create weekly plans
  for (let week = 1; week <= durationWeeks; week++) {
    const weekPlan = {
      weekNumber: week,
      focus: getWeeklyFocus(week, user.athleteType),
      goals: [
        `Complete all ${durationWeeks} scheduled workouts`,
        `Focus on proper form and technique`,
        `Prioritize recovery between sessions`
      ],
      totalVolume: `${week * 120} minutes`,
      days: {},
      recoveryStrategies: [
        "Light stretching after workouts",
        "Stay hydrated (3-4L water daily)",
        "7-8 hours of quality sleep",
        "Active recovery on rest days"
      ]
    };
    
    // Define daily workouts based on athlete type
    const dailyWorkouts = getDailyWorkouts(week, user.athleteType, intensity);
    Object.assign(weekPlan.days, dailyWorkouts);
    
    plan.weeks.push(weekPlan);
  }
  
  return plan;
}

function getWeeklyFocus(week, athleteType) {
  const focuses = {
    runner: ["Base Building", "Endurance", "Speed Development", "Peak Performance"],
    cyclist: ["Foundation", "Power", "Endurance", "Peak"],
    weightlifter: ["Hypertrophy", "Strength", "Power", "Peak"],
    crossfit: ["Skill Development", "Strength", "Metabolic Conditioning", "Competition Prep"],
    swimmer: ["Technique", "Endurance", "Speed", "Race Prep"]
  };
  
  const typeFocuses = focuses[athleteType] || ["Foundation", "Building", "Intensity", "Peak"];
  return typeFocuses[Math.min(week - 1, typeFocuses.length - 1)];
}

function getDailyWorkouts(week, athleteType, intensity) {
  const intensityMultiplier = intensity === 'hard' ? 1.2 : intensity === 'light' ? 0.8 : 1;
  
  const templates = {
    runner: {
      monday: { 
        workoutType: "Easy Run", 
        duration: `${Math.round(30 * intensityMultiplier)}-${Math.round(45 * intensityMultiplier)} min`, 
        intensity: "3-4", 
        description: "Light conversational pace, focus on form and breathing", 
        keyFocus: "Recovery & Form" 
      },
      tuesday: { 
        workoutType: "Interval Training", 
        duration: `${Math.round(45 * intensityMultiplier)}-${Math.round(60 * intensityMultiplier)} min`, 
        intensity: "7-8", 
        description: "Warm up 10min, then 8x400m at fast pace with 90s rest, cool down 10min", 
        keyFocus: "Speed Development" 
      },
      wednesday: { 
        workoutType: "Cross Training", 
        duration: `${Math.round(30 * intensityMultiplier)} min`, 
        intensity: "2-3", 
        description: "Yoga, swimming, or cycling for active recovery", 
        keyFocus: "Active Recovery & Mobility" 
      },
      thursday: { 
        workoutType: "Tempo Run", 
        duration: `${Math.round(40 * intensityMultiplier)}-${Math.round(50 * intensityMultiplier)} min`, 
        intensity: "6-7", 
        description: "10min warm up, 20min at tempo pace (comfortably hard), 10min cool down", 
        keyFocus: "Lactate Threshold" 
      },
      friday: { 
        workoutType: "Rest Day", 
        duration: "0", 
        intensity: "1", 
        description: "Complete rest or light walking", 
        keyFocus: "Full Recovery" 
      },
      saturday: { 
        workoutType: "Long Run", 
        duration: `${Math.round((60 + week * 10) * intensityMultiplier)} min`, 
        intensity: "4-5", 
        description: "Steady pace long run, focus on endurance and mental toughness", 
        keyFocus: "Endurance Building" 
      },
      sunday: { 
        workoutType: "Recovery", 
        duration: `${Math.round(20 * intensityMultiplier)}-${Math.round(30 * intensityMultiplier)} min`, 
        intensity: "2-3", 
        description: "Very easy pace or walk, optional light stretching", 
        keyFocus: "Recovery & Preparation" 
      }
    },
    weightlifter: {
      monday: { workoutType: "Upper Body", duration: "60 min", intensity: "7-8", description: "Bench press, rows, shoulder press, pull-ups", keyFocus: "Strength" },
      tuesday: { workoutType: "Lower Body", duration: "60 min", intensity: "7-8", description: "Squats, deadlifts, lunges, calf raises", keyFocus: "Power" },
      wednesday: { workoutType: "Active Recovery", duration: "30 min", intensity: "2-3", description: "Light cardio and mobility work", keyFocus: "Recovery" },
      thursday: { workoutType: "Upper Body", duration: "60 min", intensity: "6-7", description: "Incline press, lat pulldowns, dips, bicep/tricep work", keyFocus: "Hypertrophy" },
      friday: { workoutType: "Lower Body", duration: "60 min", intensity: "6-7", description: "Leg press, Romanian deadlifts, leg extensions/curls", keyFocus: "Muscle Building" },
      saturday: { workoutType: "Full Body/Conditioning", duration: "45 min", intensity: "5-6", description: "Circuit training or metabolic conditioning", keyFocus: "Endurance" },
      sunday: { workoutType: "Rest", duration: "0", intensity: "1", description: "Complete rest", keyFocus: "Recovery" }
    }
  };
  
  return templates[athleteType] || templates.runner;
}

module.exports = router;