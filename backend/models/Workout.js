const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  type: { 
    type: String, 
    enum: ['run', 'lift', 'cycle', 'swim', 'crossfit', 'yoga', 'other'],
    required: true 
  },

  date: { type: Date, default: Date.now },

  duration: { type: Number, required: true },

  distance: { type: Number, default: 0 },

  calories: { type: Number, default: 0 },

  averageHeartRate: { type: Number },

  maxHeartRate: { type: Number },

  pace: { type: Number },

  elevationGain: { type: Number },          // ✅ ADD (frontend sends this)

  perceivedEffort: {                         // ✅ ADD (CRITICAL)
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },

  sleepQuality: {                            // ✅ ADD (CRITICAL)
    type: Number,
    min: 1,
    max: 10
  },

  notes: { type: String },

  exercises: [{
    name: String,
    sets: Number,
    reps: Number,
    weight: Number,
    rpe: {                                  // ✅ ADD (frontend sends this)
      type: Number,
      min: 1,
      max: 10
    }
  }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Workout', workoutSchema);
