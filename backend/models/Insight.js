const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    type: String,
    enum: ['7d', '30d', '90d'],
    default: '30d'
  },

  summary: String,

  performanceTrends: [String],

  performanceScore: Number,
  recoveryScore: Number,
  consistencyScore: Number,
  progressScore: Number,

  strengths: [String],
  weaknesses: [String],
  recommendations: [String],
  injuryRisks: [String],

  nextSteps: {
    shortTerm: String,
    mediumTerm: String,
    longTerm: String
  },

  calculatedStats: Object,

  aiGenerated: {
    type: Boolean,
    default: false
  },

  generatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Insight', insightSchema);
