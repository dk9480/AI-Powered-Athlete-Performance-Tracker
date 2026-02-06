const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { jsPDF } = require('jspdf');

const Workout = require('../models/Workout');
const User = require('../models/User');

// Generate PDF training plan
router.post('/training-plan', auth, async (req, res) => {
  try {
    const { planData, startDate = new Date() } = req.body;
    
    if (!planData || !planData.weeks) {
      return res.status(400).json({ error: 'Invalid training plan data' });
    }
    
    // Get user info
    const user = await User.findById(req.user.id).select('-password');
    
    // Create PDF document
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    
    // Helper function to add new page
    const addNewPage = () => {
      doc.addPage();
      yPos = 20;
    };
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(40, 40, 40);
    doc.text('TRAINING PLAN', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated for: ${user.name}`, margin, yPos);
    doc.text(`Start Date: ${new Date(startDate).toLocaleDateString()}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;
    
    doc.text(`Athlete Type: ${user.athleteType}`, margin, yPos);
    doc.text(`Fitness Level: ${user.fitnessLevel}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 15;
    
    // Plan Title
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 204);
    doc.text(planData.planTitle || 'Personalized Training Plan', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`Goal: ${planData.goal || 'Improve overall fitness'}`, margin, yPos);
    yPos += 7;
    doc.text(`Duration: ${planData.durationWeeks || 4} weeks`, margin, yPos);
    yPos += 7;
    doc.text(`Intensity: ${planData.intensityLevel || 'Moderate'}`, margin, yPos);
    yPos += 15;
    
    // Add each week
    planData.weeks.forEach((week, weekIndex) => {
      // Check if we need a new page
      if (yPos > 250) {
        addNewPage();
      }
      
      // Week header
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Week ${week.weekNumber}: ${week.focus || ''}`, margin, yPos);
      yPos += 8;
      
      // Week goals
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      if (week.goals && week.goals.length > 0) {
        doc.text('Goals:', margin, yPos);
        yPos += 6;
        week.goals.forEach(goal => {
          if (yPos > 270) {
            addNewPage();
            yPos = 30;
          }
          doc.text(`• ${goal}`, margin + 5, yPos);
          yPos += 6;
        });
        yPos += 5;
      }
      
      // Weekly volume
      if (week.totalVolume) {
        doc.text(`Total Volume: ${week.totalVolume}`, margin, yPos);
        yPos += 8;
      }
      
      // Daily workouts
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      days.forEach(day => {
        if (week.days && week.days[day]) {
          const workout = week.days[day];
          
          // Check if we need a new page
          if (yPos > 270) {
            addNewPage();
            yPos = 30;
          }
          
          // Day header
          doc.setFontSize(11);
          doc.setTextColor(40, 40, 40);
          const dayName = day.charAt(0).toUpperCase() + day.slice(1);
          doc.text(`${dayName}:`, margin, yPos);
          yPos += 6;
          
          // Workout details
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          
          if (workout.workoutType) {
            doc.text(`  Type: ${workout.workoutType}`, margin + 5, yPos);
            yPos += 5;
          }
          
          if (workout.duration) {
            doc.text(`  Duration: ${workout.duration}`, margin + 5, yPos);
            yPos += 5;
          }
          
          if (workout.intensity) {
            doc.text(`  Intensity: ${workout.intensity}/10`, margin + 5, yPos);
            yPos += 5;
          }
          
          if (workout.description) {
            const lines = doc.splitTextToSize(`  Description: ${workout.description}`, pageWidth - margin - 10);
            lines.forEach(line => {
              if (yPos > 270) {
                addNewPage();
                yPos = 30;
              }
              doc.text(line, margin + 5, yPos);
              yPos += 5;
            });
          }
          
          if (workout.keyFocus) {
            doc.text(`  Focus: ${workout.keyFocus}`, margin + 5, yPos);
            yPos += 5;
          }
          
          yPos += 3; // Spacing between days
        }
      });
      
      // Recovery strategies
      if (week.recoveryStrategies && week.recoveryStrategies.length > 0) {
        yPos += 5;
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
        doc.text('Recovery Strategies:', margin, yPos);
        yPos += 6;
        
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        week.recoveryStrategies.forEach(strategy => {
          if (yPos > 270) {
            addNewPage();
            yPos = 30;
          }
          doc.text(`• ${strategy}`, margin + 5, yPos);
          yPos += 6;
        });
      }
      
      yPos += 10; // Spacing between weeks
    });
    
    // Performance metrics
    if (planData.performanceMetrics && planData.performanceMetrics.length > 0) {
      if (yPos > 220) {
        addNewPage();
      }
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Performance Metrics', margin, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      planData.performanceMetrics.forEach(metric => {
        if (yPos > 270) {
          addNewPage();
          yPos = 30;
        }
        doc.text(`• ${metric}`, margin + 5, yPos);
        yPos += 6;
      });
    }
    
    // Notes
    if (planData.notes) {
      if (yPos > 250) {
        addNewPage();
      }
      
      yPos += 10;
      doc.setFontSize(12);
      doc.setTextColor(0, 102, 204);
      doc.text('Important Notes:', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const noteLines = doc.splitTextToSize(planData.notes, pageWidth - 2 * margin);
      noteLines.forEach(line => {
        if (yPos > 270) {
          addNewPage();
          yPos = 20;
        }
        doc.text(line, margin, yPos);
        yPos += 6;
      });
    }
    
    // Footer
    const finalPage = doc.internal.getNumberOfPages();
    for (let i = 1; i <= finalPage; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated by Athlete Training App • Page ${i} of ${finalPage} • ${new Date().toLocaleDateString()}`, 
        pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    // Convert to buffer 
    const pdfOutput = doc.output(); // Changed from output('arraybuffer')
    const pdfBuffer = Buffer.from(pdfOutput, 'binary'); // Added binary encoding
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="training-plan-${Date.now()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.end(pdfBuffer); // Changed from res.send()
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    });
  }
});

// Export workout log as PDF
router.get('/workout-log', auth, async (req, res) => {
  try {
    const { 
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      type
    } = req.query;
    
    // Get user info
    const user = await User.findById(req.user.id).select('-password');
    
    // Build query
    const query = { userId: req.user.id };
    
    if (startDate) {
      query.date = { ...query.date, $gte: new Date(startDate) };
    }
    
    if (endDate) {
      query.date = { ...query.date, $lte: new Date(endDate) };
    }
    
    if (type) {
      query.type = type;
    }
    
    // Get workouts
    const workouts = await Workout.find(query)
      .sort({ date: -1 })
      .lean();
    
    // Create PDF
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(40, 40, 40);
    doc.text('WORKOUT LOG', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Athlete: ${user.name}`, margin, yPos);
    yPos += 7;
    
    const periodText = `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    doc.text(periodText, margin, yPos);
    yPos += 15;
    
    // Summary statistics
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalDistance = workouts.reduce((sum, w) => sum + (w.distance || 0), 0);
    const totalCalories = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('Summary Statistics', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    
    const stats = [
      `Total Workouts: ${totalWorkouts}`,
      `Total Duration: ${totalDuration} minutes`,
      `Total Distance: ${totalDistance.toFixed(2)} km`,
      `Total Calories: ${totalCalories}`,
      `Average Duration: ${(totalDuration / totalWorkouts).toFixed(1)} minutes per workout`
    ];
    
    stats.forEach(stat => {
      doc.text(stat, margin, yPos);
      yPos += 7;
    });
    
    yPos += 10;
    
    // Workout table
    if (workouts.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 102, 204);
      doc.text('Workout Details', margin, yPos);
      yPos += 10;
      
      // Table headers
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
      
      let xPos = margin;
      doc.text('Date', xPos, yPos);
      xPos += 25;
      doc.text('Type', xPos, yPos);
      xPos += 25;
      doc.text('Duration', xPos, yPos);
      xPos += 25;
      doc.text('Distance', xPos, yPos);
      xPos += 25;
      doc.text('Calories', xPos, yPos);
      xPos += 25;
      doc.text('Pace', xPos, yPos);
      
      yPos += 10;
      
      // Table rows
      doc.setFontSize(9);
      workouts.forEach((workout, index) => {
        // Check if we need a new page
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
          
          // Repeat headers on new page
          doc.setFontSize(10);
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
          
          xPos = margin;
          doc.text('Date', xPos, yPos);
          xPos += 25;
          doc.text('Type', xPos, yPos);
          xPos += 25;
          doc.text('Duration', xPos, yPos);
          xPos += 25;
          doc.text('Distance', xPos, yPos);
          xPos += 25;
          doc.text('Calories', xPos, yPos);
          xPos += 25;
          doc.text('Pace', xPos, yPos);
          
          yPos += 10;
          doc.setFontSize(9);
        }
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 7, 'F');
        }
        
        xPos = margin;
        doc.text(new Date(workout.date).toLocaleDateString(), xPos, yPos);
        xPos += 25;
        doc.text(workout.type, xPos, yPos);
        xPos += 25;
        doc.text(`${workout.duration || 0} min`, xPos, yPos);
        xPos += 25;
        doc.text(workout.distance ? `${workout.distance.toFixed(1)} km` : '-', xPos, yPos);
        xPos += 25;
        doc.text(workout.calories ? workout.calories.toString() : '-', xPos, yPos);
        xPos += 25;
        doc.text(workout.pace ? `${workout.pace.toFixed(1)} min/km` : '-', xPos, yPos);
        
        yPos += 7;
      });
    } else {
      doc.setFontSize(12);
      doc.setTextColor(150, 150, 150);
      doc.text('No workouts found for the selected period', pageWidth / 2, yPos, { align: 'center' });
      yPos += 20;
    }
    
    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on ${new Date().toLocaleDateString()} • Page ${i} of ${totalPages}`, 
        pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    // Convert to buffer 
    const pdfOutput = doc.output(); // Changed from output('arraybuffer')
    const pdfBuffer = Buffer.from(pdfOutput, 'binary'); // Added binary encoding
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="workout-log-${Date.now()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF 
    res.end(pdfBuffer); // Changed from res.send()
    
  } catch (error) {
    console.error('Workout log PDF error:', error);
    res.status(500).json({ 
      error: 'Failed to generate workout log PDF',
      details: error.message 
    });
  }
});

module.exports = router;