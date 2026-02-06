const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Workout = require('../models/Workout');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose'); 

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.csv', '.gpx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and GPX files are allowed'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Log a new workout
router.post('/', auth, async (req, res) => {
  try {
    const workoutData = {
      userId: req.user.id,
      ...req.body
    };

    // Calculate pace if distance and duration are provided
    if (workoutData.distance && workoutData.distance > 0 && workoutData.duration) {
      workoutData.pace = workoutData.duration / workoutData.distance;
    }

    const workout = new Workout(workoutData);
    await workout.save();

    res.status(201).json({
      message: 'Workout logged successfully',
      workout
    });
  } catch (error) {
    console.error('Log workout error:', error);
    res.status(500).json({ error: 'Failed to log workout' });
  }
});

// Upload workout data from CSV
router.post('/upload/csv', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workouts = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        try {
          // Parse CSV row into workout format
          const workout = {
            userId: req.user.id,
            type: row.type?.toLowerCase() || 'run',
            title: row.title || `${row.type} Workout`,
            date: new Date(row.date || Date.now()),
            duration: parseFloat(row.duration) || 0,
            distance: parseFloat(row.distance) || 0,
            calories: parseInt(row.calories) || 0,
            averageHeartRate: parseInt(row.avgHR || row.averageHeartRate) || null,
            maxHeartRate: parseInt(row.maxHR || row.maxHeartRate) || null,
            pace: parseFloat(row.pace) || null,
            notes: row.notes || '',
            csvFile: req.file.filename
          };

          // Calculate pace if not provided
          if (!workout.pace && workout.distance > 0 && workout.duration > 0) {
            workout.pace = workout.duration / workout.distance;
          }

          workouts.push(workout);
        } catch (parseError) {
          console.error('Error parsing CSV row:', parseError);
        }
      })
      .on('end', async () => {
        try {
          if (workouts.length === 0) {
            fs.unlinkSync(filePath); // Clean up empty file
            return res.status(400).json({ error: 'No valid workout data found in CSV' });
          }

          const savedWorkouts = await Workout.insertMany(workouts);
          
          res.status(201).json({
            message: `Successfully imported ${savedWorkouts.length} workouts`,
            count: savedWorkouts.length,
            workouts: savedWorkouts
          });
        } catch (dbError) {
          console.error('Database error:', dbError);
          res.status(500).json({ error: 'Failed to save workouts to database' });
        } finally {
          // Clean up uploaded file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.status(500).json({ error: 'Failed to parse CSV file' });
      });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get all workouts for current user
router.get('/', auth, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      type, 
      limit = 100, 
      page = 1,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const query = { userId: req.user.id };
    
    // Date filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Type filtering
    if (type) {
      query.type = type;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query
    const workouts = await Workout.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);
    
    // Get total count for pagination info
    const total = await Workout.countDocuments(query);
    
    res.json({
      workouts,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// Get workout by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    res.json(workout);
  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({ error: 'Failed to fetch workout' });
  }
});

// Update workout
router.put('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    res.json({
      message: 'Workout updated successfully',
      workout
    });
  } catch (error) {
    console.error('Update workout error:', error);
    res.status(500).json({ error: 'Failed to update workout' });
  }
});

// Delete workout
router.delete('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

// Get workout statistics - FIXED VERSION
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    console.log('📊 Getting stats for user ID:', req.user.id);
    
    // Convert userId to ObjectId for aggregation
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    // Check if user has any workouts
    const totalWorkoutsCount = await Workout.countDocuments({ userId: req.user.id });
    console.log(`📈 Total workouts in database: ${totalWorkoutsCount}`);
    
    if (totalWorkoutsCount === 0) {
      console.log('⚠️ No workouts found for user');
      return res.json({
        overview: {
          totalWorkouts: 0,
          totalDuration: 0,
          totalDistance: 0,
          totalCalories: 0,
          avgHeartRate: null,
          avgPace: null,
          avgPerceivedEffort: null
        },
        weeklyActivity: [],
        byType: [],
        recentProgress: []
      });
    }
    
    // Overall statistics - FIXED: Using ObjectId
    const stats = await Workout.aggregate([
      { 
        $match: { 
          userId: userId,  // Using ObjectId
          date: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDuration: { $sum: { $ifNull: ["$duration", 0] } },
          totalDistance: { $sum: { $ifNull: ["$distance", 0] } },
          totalCalories: { $sum: { $ifNull: ["$calories", 0] } },
          avgHeartRate: { $avg: "$averageHeartRate" },
          avgPace: { $avg: "$pace" },
          avgPerceivedEffort: { $avg: "$perceivedEffort" }
        }
      }
    ]);
    
    console.log('📊 Aggregation result:', stats);
    
    // Weekly activity - FIXED: Using ObjectId
    const weeklyActivity = await Workout.aggregate([
      { 
        $match: { 
          userId: userId,  // Using ObjectId
          date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
        } 
      },
      {
        $group: {
          _id: { $dayOfWeek: "$date" },
          count: { $sum: 1 },
          totalDuration: { $sum: "$duration" },
          totalDistance: { $sum: "$distance" },
          totalCalories: { $sum: "$calories" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    // Workouts by type - FIXED: Using ObjectId
    const byType = await Workout.aggregate([
      { 
        $match: { 
          userId: userId,  // Using ObjectId
          date: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalDuration: { $sum: "$duration" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Recent progress (last 10 workouts) - UPDATED FOR GRAPH
    const recentProgressRaw = await Workout.find({ 
    userId: req.user.id,
    date: { $gte: startDate }
  })
  .sort({ date: -1 })
  .limit(10)
  .select('date duration distance pace type')
  .lean();

// Convert to trend-friendly data
const recentProgress = recentProgressRaw
  .reverse()
  .map((w, index) => ({
    workoutIndex: index + 1,   // clean X-axis
    duration: w.duration || 0,
    distance: w.distance || 0,
    pace: w.pace || null,
    date: w.date
  }));


  
    
    // Prepare response
    const overview = stats[0] || {
      totalWorkouts: 0,
      totalDuration: 0,
      totalDistance: 0,
      totalCalories: 0,
      avgHeartRate: null,
      avgPace: null,
      avgPerceivedEffort: null
    };
    
    console.log('✅ Final overview:', overview);
    
    res.json({
      overview: overview,
      weeklyActivity: weeklyActivity || [],
      byType: byType || [],
      recentProgress: recentProgress.reverse() || []
    });
    
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      details: error.message 
    });
  }
});

// Get monthly summary
router.get('/stats/monthly', auth, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const monthlyStats = await Workout.aggregate([
      {
        $match: {
          userId: req.user.id,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${parseInt(year) + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$date" },
          workouts: { $sum: 1 },
          totalDuration: { $sum: "$duration" },
          totalDistance: { $sum: "$distance" },
          totalCalories: { $sum: "$calories" },
          avgPace: { $avg: "$pace" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    // Fill in missing months
    const completeStats = [];
    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyStats.find(m => m._id === month) || {
        _id: month,
        workouts: 0,
        totalDuration: 0,
        totalDistance: 0,
        totalCalories: 0,
        avgPace: null
      };
      completeStats.push(monthData);
    }
    
    res.json({ year, monthlyStats: completeStats });
  } catch (error) {
    console.error('Monthly stats error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly statistics' });
  }
});

module.exports = router;