# AI Planner App

## Overview
A comprehensive AI-powered task planning application that helps users break down complex tasks into manageable subtasks and automatically schedules them with time buffers. The app integrates with Google Calendar for seamless event management.

## Features
- **Task Input**: Text-based task creation with optional image upload
- **OCR Support**: Extract text from images using Tesseract.js
- **AI-Powered Breakdown**: Uses Claude AI to intelligently break tasks into 25-60 minute subtasks
- **Manual Subtask Entry**: Option for users to manually define their own subtasks
- **Smart Scheduling**: Automatically schedules tasks with 10-minute buffers between each
- **Google Calendar Integration**: One-click export to Google Calendar
- **SQLite Database**: Persistent storage using Prisma ORM

## Tech Stack
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js with Express
- **Database**: SQLite with Prisma ORM
- **AI**: Anthropic Claude (via Replit AI Integrations)
- **OCR**: Tesseract.js
- **Calendar**: Google Calendar API (via Replit connector)

## Project Structure
```
├── public/
│   ├── index.html      # Main frontend interface
│   ├── styles.css      # Styling
│   └── app.js          # Frontend JavaScript
├── lib/
│   ├── anthropic.js    # AI integration for task breakdown
│   └── calendar.js     # Google Calendar integration
├── prisma/
│   └── schema.prisma   # Database schema
├── server.js           # Express backend server
└── package.json        # Dependencies
```

## API Endpoints
- `GET /api/health` - Health check
- `POST /api/ocr` - Extract text from uploaded images
- `POST /api/ai-breakdown` - Generate AI-powered task breakdown
- `POST /api/schedule` - Create task schedule with buffers
- `POST /api/calendar/add-events` - Add events to Google Calendar
- `GET /api/tasks` - Get all tasks with subtasks and events

## Database Schema
- **Task**: Main task entity with title and description
- **Subtask**: Individual subtasks with duration (25-60 min) and order
- **Event**: Scheduled events with start/end times and 10-min buffers

## Integrations
- **Anthropic AI**: Uses Replit AI Integrations for Claude access (no API key needed, billed to Replit credits)
- **Google Calendar**: Connected via Replit connector for OAuth management

## Recent Changes
- 2025-11-07: Initial project setup with full functionality
  - Created frontend with modern UI
  - Built Express backend with all routes
  - Integrated Anthropic AI for task breakdown
  - Added Google Calendar sync
  - Implemented OCR for image text extraction
  - Set up Prisma with SQLite database

## User Preferences
None specified yet.

## Architecture Decisions
- Using Replit integrations for both AI and Calendar to simplify secret management
- SQLite chosen for simplicity and portability
- Tasks scheduled with 10-minute buffers to account for breaks and transitions
- Subtask durations constrained to 25-60 minutes for optimal focus periods
- Frontend uses vanilla JavaScript to avoid build complexity
