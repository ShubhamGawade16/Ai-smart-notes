# AI Smart Notes - Replit Configuration

## Overview

This is a full-stack TypeScript application for intelligent task and note management with AI-powered features. The application uses React for the frontend, Express.js for the backend, and PostgreSQL with Drizzle ORM for data persistence. It features AI-powered task categorization, productivity insights, and smart suggestions using OpenAI's GPT-4o model.

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with custom configuration for development and production
- **Authentication**: Supabase Auth with Google OAuth integration

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Supabase JWT token verification
- **Database**: In-memory storage (MemStorage) for development and prototyping
- **AI Integration**: OpenAI GPT-4o for task categorization, tagging, and productivity insights
- **API Design**: RESTful API with Supabase-compatible authentication middleware

### Database Schema
The application uses two main entities:
- **Tasks**: Support title, description, priority levels, categories, tags, due dates, completion tracking, and AI suggestions
- **Notes**: Include title, content, categories, tags, and AI-generated summaries
- Both entities include automatic timestamps and UUID primary keys

## Key Components

### AI Service Integration
- **Smart Categorization**: Automatically categorizes tasks and notes based on content analysis
- **Priority Detection**: AI determines task priority levels (low/medium/high) and time estimates
- **Productivity Insights**: Analyzes patterns to provide bottleneck detection and optimization suggestions
- **Tag Generation**: Automatically generates relevant tags for better organization

### Frontend Components
- **Dashboard**: Main interface with responsive design and mobile navigation
- **Task Management**: Quick add functionality, task completion tracking, and today's focus view
- **Note System**: Recent notes display with AI summaries and category organization
- **Analytics**: Progress tracking, category breakdowns, and completion statistics
- **Theme System**: Dark/light mode with system preference detection

### Backend Services
- **Storage Abstraction**: Interface-based storage layer supporting both in-memory and database implementations
- **AI Service**: Centralized OpenAI integration for content analysis and optimization
- **Route Handling**: Organized API endpoints for tasks, notes, and analytics
- **Error Handling**: Consistent error responses and logging across all endpoints

## Data Flow

1. **Task/Note Creation**: User input → AI analysis → Database storage with enhanced metadata
2. **AI Insights**: Periodic analysis of user patterns → Productivity recommendations
3. **Real-time Updates**: TanStack Query manages cache invalidation and optimistic updates
4. **Mobile Responsiveness**: Adaptive UI that works seamlessly across desktop and mobile devices

## External Dependencies

### Core Dependencies
- **Database**: Neon serverless PostgreSQL for cloud-native scaling
- **AI**: OpenAI API for GPT-4o model access
- **UI Framework**: Extensive Radix UI component library for accessibility
- **Development**: Vite with TypeScript, ESBuild for production builds

### Development Tools
- **Type Safety**: Strict TypeScript configuration with path mapping
- **Database Management**: Drizzle Kit for migrations and schema management
- **Code Quality**: Integrated linting and formatting tools
- **Replit Integration**: Custom Vite plugins for development environment

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with hot module replacement
- **Database**: Environment variable-based connection to PostgreSQL
- **AI Service**: OpenAI API key configuration through environment variables

### Production Build
- **Client**: Vite builds optimized React application to `dist/public`
- **Server**: ESBuild bundles Express server to `dist/index.js`
- **Assets**: Static file serving with proper caching headers
- **Environment**: NODE_ENV-based configuration switching

### Key Features
- **Mobile-First Design**: Responsive layout with dedicated mobile navigation
- **Real-time Insights**: AI-powered productivity analytics and suggestions
- **Offline-Capable**: Service worker integration for improved performance
- **Accessibility**: Full keyboard navigation and screen reader support
- **Performance**: Optimized bundle sizes and lazy loading strategies