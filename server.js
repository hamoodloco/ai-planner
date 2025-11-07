import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createWorker } from 'tesseract.js';
import { PrismaClient } from '@prisma/client';
import { generateTaskBreakdown } from './lib/anthropic.js';
import { addMultipleCalendarEvents } from './lib/calendar.js';

const app = express();
const prisma = new PrismaClient();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Planner API is running' });
});

// OCR endpoint - Extract text from image
app.post('/api/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    console.log('Processing OCR for uploaded image...');
    
    const worker = await createWorker('eng');
    const { data } = await worker.recognize(req.file.buffer);
    await worker.terminate();

    const extractedText = data.text.trim();
    
    console.log('OCR completed successfully');
    res.json({ 
      success: true, 
      text: extractedText 
    });
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// AI Breakdown endpoint - Generate subtasks using Claude
app.post('/api/ai-breakdown', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Task title is required' });
    }

    console.log('Generating AI breakdown for task:', title);

    const subtasks = await generateTaskBreakdown(title, description);

    console.log('AI breakdown generated:', subtasks.length, 'subtasks');
    res.json({ 
      success: true, 
      subtasks 
    });
  } catch (error) {
    console.error('AI Breakdown Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Schedule endpoint - Create task and schedule with buffers
app.post('/api/schedule', async (req, res) => {
  try {
    const { title, description, subtasks, manual } = req.body;

    if (!title || !subtasks || !Array.isArray(subtasks)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request data' 
      });
    }

    console.log('Creating schedule for task:', title);

    // Create task in database
    const task = await prisma.task.create({
      data: {
        title,
        description,
        manual: manual || false,
      }
    });

    // Create subtasks in database
    const createdSubtasks = await Promise.all(
      subtasks.map((subtask, index) =>
        prisma.subtask.create({
          data: {
            taskId: task.id,
            title: subtask.title,
            description: subtask.description,
            duration: subtask.duration,
            order: index,
          }
        })
      )
    );

    // Generate schedule with 10-minute buffers
    const schedule = [];
    let currentTime = new Date();
    
    // Round to next 15-minute interval for cleaner scheduling
    const minutes = currentTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    currentTime.setMinutes(roundedMinutes, 0, 0);

    for (const subtask of createdSubtasks) {
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + subtask.duration * 60000);
      
      // Create event in database
      const event = await prisma.event.create({
        data: {
          taskId: task.id,
          subtaskId: subtask.id,
          title: subtask.title,
          description: subtask.description,
          startTime,
          endTime,
          bufferMinutes: 10,
        }
      });

      schedule.push({
        id: event.id,
        title: subtask.title,
        description: subtask.description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        bufferMinutes: 10,
      });

      // Add duration + 10-minute buffer for next task
      currentTime = new Date(endTime.getTime() + 10 * 60000);
    }

    console.log('Schedule created with', schedule.length, 'events');

    res.json({ 
      success: true, 
      task: {
        id: task.id,
        title: task.title,
        description: task.description
      },
      schedule 
    });
  } catch (error) {
    console.error('Schedule Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Google Calendar endpoint - Add events to calendar
app.post('/api/calendar/add-events', async (req, res) => {
  try {
    const { taskId, events } = req.body;

    if (!taskId || !events || !Array.isArray(events)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request data' 
      });
    }

    console.log('Adding', events.length, 'events to Google Calendar');

    const results = await addMultipleCalendarEvents(events);

    // Update events in database with Google Calendar event IDs
    for (let i = 0; i < results.length; i++) {
      if (results[i].success) {
        await prisma.event.update({
          where: { id: events[i].id },
          data: { googleEventId: results[i].eventId }
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Successfully added ${successCount}/${events.length} events to calendar`);

    res.json({ 
      success: true, 
      message: `Successfully added ${successCount} events to Google Calendar`,
      results 
    });
  } catch (error) {
    console.error('Calendar Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        subtasks: {
          orderBy: { order: 'asc' }
        },
        events: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Get Tasks Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Planner server running on http://0.0.0.0:${PORT}`);
  console.log(`📅 Google Calendar integration ready`);
  console.log(`🤖 Anthropic AI integration ready`);
  console.log(`📷 OCR (Tesseract.js) ready`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await prisma.$disconnect();
  process.exit(0);
});
