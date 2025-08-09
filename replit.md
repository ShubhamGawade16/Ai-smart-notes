# Planify - Replit Configuration

## Overview

Planify is an AI-first task management application powered by OpenAI GPT-4o Mini. It offers AI-driven smart segregation, task analysis, AI breakdown capabilities, comprehensive AI suggestions, interactive mind map visualization, and an advanced task view mode with priority meters and description hover functionality. The platform features a clean, simplistic UI/UX design with a teal theme.

**Business Vision & Market Potential:**
Planify aims to be a leading AI-powered productivity tool with a freemium model. The strategy is to provide essential productivity with light AI assistance for free users, with clear upgrade paths to Basic, Advanced, and Premium Pro tiers offering unlimited AI features, predictive focus forecasting, auto-scheduling, and personalized optimization. The ambition is to create a habit-forming platform that encourages natural upgrades through enhanced capabilities.

**Recent Authentication Improvements (August 2025):**
- Completely removed loading states from authentication for instant sign-in experience
- Streamlined signup flow: users get immediate success message and can sign in right away
- Added simple email verification handler that redirects users to sign-in page
- Eliminated friction points and unnecessary waiting screens as requested by user
- Authentication now provides immediate feedback and seamless user experience

**Critical AI Credit System Fix (August 2025):**
- Fixed critical double-counting bug where AI features consumed 2-3 credits instead of 1
- Root cause: Both frontend and backend were incrementing AI usage simultaneously
- Solution: Centralized all AI credit tracking to backend endpoints only
- Removed frontend incrementAiUsage() calls from all AI features to prevent double-counting
- All AI features now properly consume exactly 1 credit per use as intended
- Fixed components: AI Chat Assistant, Task Refiner, Smart Timing, Productivity Insights, Enhanced Smart Timing, Simple Task Input, and dashboard pages

## User Preferences

Preferred communication style: Simple, everyday language.
Payment Gateway: Razorpay (user in India, cannot access Stripe invite-only, no PayPal business account)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Supabase JWT token verification
- **Database**: In-memory storage (MemStorage) for development prototyping. Neon serverless PostgreSQL for production.
- **AI Integration**: OpenAI GPT-4o for task categorization, tagging, and productivity insights
- **API Design**: RESTful API with Supabase-compatible authentication middleware

### Database Schema
The application manages `Tasks` and `Notes` entities, both including automatic timestamps and UUID primary keys.
- **Tasks**: Title, description, priority levels, task types (creative/routine/analytical/deep work/communication/learning), categories, tags, due dates, completion tracking, AI suggestions, readiness scores, and optimal timing data.
- **Notes**: Title, content, categories, tags, AI-generated summaries.

### Key Components & Features
- **AI Service Integration**: Smart categorization, priority detection, productivity insights, tag generation, and Smart Timing analysis powered by AI.
- **Smart Timing Feature**: AI-powered task readiness scoring (0-100) based on circadian rhythms, time zones, task types (creative/routine/analytical/deep work/communication/learning), and optimal timing recommendations. Includes current time analysis, personalized timing suggestions, and productivity optimization.
- **Frontend Components**: Responsive dashboard, quick add task functionality, note system with AI summaries, analytics for progress tracking, Smart Timing tab with readiness analysis, and a theme system (dark/light mode).
- **Backend Services**: Storage abstraction layer, centralized AI service, organized API endpoints (tasks, notes, analytics, smart-timing), and consistent error handling.
- **UI/UX Decisions**: Clean, minimalist UI/UX design with a new teal theme (hsl(173, 58%, 39%)). Features include a modern task item design with hover-based actions, tabbed task lists (Today/All/Done/Smart Timing), conversational AI refiner interfaces with gradient designs, and a 4-column dashboard layout. Advanced task view includes priority meters and description hover functionality. Mobile-first design principles are applied throughout for touch-friendly interfaces and responsive layouts across devices.

### System Design Choices
- **Data Flow**: User input initiates AI analysis, followed by database storage with enhanced metadata. Periodic AI analysis generates productivity recommendations. TanStack Query manages real-time updates through cache invalidation and optimistic updates.
- **Authentication**: Supabase Auth with Google OAuth integration for frontend, Supabase JWT verification for backend.
- **Mobile-First Design**: Responsive layout with dedicated mobile navigation and touch-friendly interfaces.
- **Performance & Accessibility**: Optimized bundle sizes, lazy loading strategies, full keyboard navigation, and screen reader support.

## External Dependencies

- **Database**: Neon serverless PostgreSQL, Drizzle Kit for schema management.
- **AI**: OpenAI API for GPT-4o model access. OpenRouter/DeepSeek for AI services.
- **Authentication**: Supabase Auth.
- **UI Framework**: Radix UI (via shadcn/ui).
- **Development Tools**: Vite, TypeScript, ESBuild.
```