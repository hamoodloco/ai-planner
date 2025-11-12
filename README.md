# AI Planner - Enterprise Edition

> Production-ready AI task planner with Google Calendar integration, OCR task extraction, and timeline scheduling.

## 🎯 Project Status

**REFACTOR IN PROGRESS** - Enterprise architecture migration initiated on Nov 12, 2025

### Current Phase: Directory Structure Created ✅

- ✅ Backup created (`.backup_20251112_002729`)
- ✅ Enterprise folder structure established
- ⏳ Code migration in progress
- ⏳ Dependencies update pending
- ⏳ Configuration files pending

## 🏗️ New Architecture

### Clean Architecture Layers

```
src/
├── api/                    # API Layer
│   ├── controllers/        # HTTP request handlers
│   ├── middleware/         # Express middleware
│   └── routes/            # API routes
├── core/                   # Business Logic Layer
│   ├── tasks/             # Task management
│   ├── auth/              # Authentication
│   ├── calendar/          # Google Calendar integration
│   ├── ocr/               # Image text extraction
│   └── agenda/            # Agenda management
├── infrastructure/         # Infrastructure Layer
│   ├── database/          # Prisma client
│   ├── cache/             # Redis/Memory cache
│   ├── logging/           # Winston logger
│   └── crypto/            # Encryption utilities
└── shared/                # Shared Layer
    ├── types/             # TypeScript types
    ├── utils/             # Utilities
    └── config/            # Configuration
```

## 🚀 Features

- ✅ **AI-Powered Task Planning** - Intelligent task breakdown
- ✅ **Google Calendar Sync** - Bidirectional calendar integration
- ✅ **OCR Support** - Extract tasks from images
- ✅ **Smart Scheduling** - 25-60 min sessions with buffers
- ✅ **Timeline View** - Drag-and-drop scheduling
- ✅ **Voice Mode** - Voice input support (stub)

## 📋 Next Steps

### For Developers

1. **Review the architecture**
   ```bash
   ls -la src/
   ```

2. **Update package.json** - Add new dependencies:
   - TypeScript
   - Zod for validation
   - Winston for logging  
   - Jest for testing

3. **Create configuration files**:
   - `tsconfig.json`
   - `.env.example`
   - `jest.config.js`
   - `.eslintrc.js`

4. **Migrate existing code**:
   - Move `server.js` logic to `src/api/`
   - Split `lib/` into appropriate modules
   - Update Prisma configuration

5. **Install dependencies**:
   ```bash
   npm install
   ```

6. **Run migrations**:
   ```bash
   npx prisma migrate dev
   ```

7. **Start development**:
   ```bash
   npm run dev
   ```

## 📦 Technology Stack

### Current (v1)
- Node.js 20
- Express
- Prisma ORM (SQLite)
- Google Calendar API
- Tesseract.js (OCR)
- Vanilla JavaScript frontend

### Target (v2 - Enterprise)
- Node.js 20 + TypeScript
- Express with typed routes
- Prisma ORM (PostgreSQL/SQLite)
- Redis caching
- Winston logging
- Zod validation
- Jest testing
- Web Components frontend

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
BASE_URL=https://your-repl-url.repl.co
ENCRYPTION_KEY=your-32-char-hex-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-repl-url.repl.co/auth/google/callback
NODE_ENV=development
PORT=3000
```

## 📚 Documentation

- [Architecture Guide](docs/ARCHITECTURE.md) - ⏳ Coming soon
- [API Documentation](docs/API.md) - ⏳ Coming soon
- [Migration Guide](docs/MIGRATION.md) - ⏳ Coming soon

## 🎉 Original Features (Preserved)

All v1 features are preserved in the backup and will be migrated:

- Task creation from text/images
- AI task breakdown
- Google Calendar OAuth
- Session scheduling with routines
- Commit to calendar
- Daily agenda view
- Timeline drag-and-drop

## 🤝 Contributing

This is an active refactor project. Please wait for the migration to complete before contributing.

## 📝 License

MIT

---

**Last Updated**: November 12, 2025  
**Status**: 🚧 Enterprise Refactor In Progress  
**Next Milestone**: Code Migration
