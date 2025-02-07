# FlashMind - AI-Powered Flashcard App

## Overview

FlashMind is an AI-powered flashcard application designed to help users create and study flashcards with ease. The app provides an intuitive, clean interface with AI-assisted features powered by Deepseek AI. It follows a freemium model where basic features are free and advanced AI capabilities are available through premium subscriptions.

## Tech Stack:

Frontend: React Native with TypeScript, Expo, and Expo Router
Backend/Database: Supabase
UI Framework: React Native Paper
AI Processing: DeepSeek

## Core Features

### Authentication

- Email-based signup and login via Supabase
- Secure user authentication and session management

### Main Dashboard

- Category-based organization (Languages, Science, History, etc.)
- Quick access to create new flashcards and categories
- Progress tracking and study statistics

### Flashcard Management

- Support for multiple flashcard types:

  1. **Classic Cards**

     - Traditional term and definition format
     - Front and back content
     - Manual creation and AI assistance

  2. **True/False Cards**

     - Statement-based cards
     - User marks if statement is true or false
     - Great for fact checking and quick review

  3. **Multiple Choice Cards**
     - Question with four possible answers
     - Drag-and-drop interface for answer selection
     - Only one correct answer
     - Interactive and engaging format

- Category organization and tagging
- AI-assisted definition improvements (Premium)
- Search functionality across all categories
- Advanced filtering options (difficulty, last studied, etc.)

### Study Features

- Quiz-style flashcard review
- "Learned" and "Difficult" card marking
- AI-powered spaced repetition (Premium)
- Personalized study plans (Premium)
- Text-to-speech for terms and definitions
- Customizable text size for accessibility

### AI Capabilities (Premium)

- Automated category generation and suggestions
- Smart study interval recommendations
- Performance analytics and insights
- Definition quality improvements
- Personalized learning paths
- Continuous adaptation to user performance
- AI-powered feedback on flashcard clarity

### Social & Collaboration

- Flashcard sharing between users
- Collaborative study groups
- Community-driven flashcard sets
- User rankings and leaderboards
- Shared category access

### User Experience

- Interactive onboarding tutorial
- Customizable themes (light/dark mode)
- Achievement badges and rewards
- Daily/weekly study streaks
- Cross-device synchronization
- Seamless mobile/desktop experience

## Monetization

### Free Tier

- Basic flashcard creation and management
- Manual category organization
- Limited features with ads
- Basic search and filter functionality

### Premium Tier

- Full AI-powered feature set
- Maximum 100 flashcards per category
- Maximum 200 API tokens per month
- Unlimited flashcards and categories
- Users can put in their notes to make ai flashcards
- Ad-free experience

- Monthly or yearly subscription options

## Database Schema

### Tables

#### users

- id: uuid (PK)
- email: string (unique)
- created_at: timestamp
- last_login: timestamp
- is_premium: boolean
- streak_count: integer
- settings: jsonb

#### categories

- id: uuid (PK)
- user_id: uuid (FK -> users.id)
- name: string
- description: text
- color: string
- created_at: timestamp
- updated_at: timestamp
- is_public: boolean

#### flashcards

- id: uuid (PK)
- category_id: uuid (FK -> categories.id)
- user_id: uuid (FK -> users.id)
- card_type: enum ('classic', 'true_false', 'multiple_choice')
- term: string
- definition: text
- options: jsonb // Stores multiple choice options or true/false statement
- correct_answer: text // For multiple choice/true-false cards
- created_at: timestamp
- updated_at: timestamp
- last_reviewed: timestamp
- difficulty_level: integer
- times_reviewed: integer
- is_learned: boolean

#### study_sessions

- id: uuid (PK)
- user_id: uuid (FK -> users.id)
- category_id: uuid (FK -> categories.id)
- started_at: timestamp
- ended_at: timestamp
- cards_reviewed: integer
- correct_answers: integer

#### achievements

- id: uuid (PK)
- user_id: uuid (FK -> users.id)
- achievement_type: string
- achieved_at: timestamp
- metadata: jsonb

## Project Structure

FlashMind/
├── app/
│ └── (app)/
│ ├── (tabs)/
│ │ ├── CategoryBrowserScreen.tsx
│ │ ├── DashboardScreen.tsx # Main dashboard (was index.tsx)
│ │ ├── StudyOverviewScreen.tsx # Study overview (was study.tsx)
│ │ ├── ProfileScreen.tsx # User profile
│ │ └── \_layout.tsx
│ ├── category/
│ │ └── [id]/
│ │ └── CategoryViewScreen.tsx
│ ├── flashcard/
│ │ ├── create/
│ │ │ └── [categoryId]/
│ │ │ └── FlashcardCreatorScreen.tsx
│ │ └── edit/
│ │ └── [id]/
│ │ └── FlashcardEditorScreen.tsx
│ └── study/
│ └── [categoryId]/
│ └── StudySessionScreen.tsx
├── features/
│ └── cards/
│ ├── components/
│ │ ├── viewers/
│ │ │ ├── CardViewerFactory.tsx
│ │ │ ├── ClassicCardViewer.tsx
│ │ │ ├── TrueFalseCardViewer.tsx
│ │ │ └── MultiChoiceViewer.tsx
│ │ ├── forms/
│ │ │ ├── ClassicCardForm.tsx
│ │ │ ├── TrueFalseCardForm.tsx
│ │ │ └── MultiChoiceCardForm.tsx
│ │ └── lists/
│ │ ├── CategoryCardGrid.tsx
│ │ └── CategoryCardSections.tsx
│ └── types/
│ └── cards.ts

## Features

- `/features` - Feature-based modules
  - `/cards` - Card feature module
    - `/components`
      - `/viewers` - Card display components
        - `CardViewerFactory.tsx` - Factory pattern for card display
        - `ClassicCardViewer.tsx` - Traditional flashcard viewer
        - `TrueFalseCardViewer.tsx` - True/False statement viewer
        - `MultiChoiceViewer.tsx` - Multiple choice viewer
      - `/forms` - Card creation/editing forms
        - `ClassicCardForm.tsx` - Classic card form
        - `TrueFalseCardForm.tsx` - True/False card form
        - `MultiChoiceCardForm.tsx` - Multiple choice form
      - `/lists` - Card list/grid components
        - `CategoryCardGrid.tsx` - Category card grid view
        - `CategoryCardSections.tsx` - Sectioned card list view
    - `/types`
      - `cards.ts` - Card type definitions

# FlashMind Project Structure

## Core Features

- `/app` - Main application screens and navigation
  - `/(app)` - Protected app routes
    - `/(tabs)` - Bottom tab navigation screens
    - `/admin` - Admin-only screens (development)
    - `/premium` - Premium subscription screens
  - `/auth` - Authentication screens

## Features

- `/features` - Feature-based modules
  - `/ai` - AI-powered features
    - `/components`
      - `AIFlashcardEditor.tsx` - AI assistance for flashcard creation
      - `AICategoryAssistant.tsx` - AI assistance for category creation
    - `/hooks`
      - `useDeepseekAI.ts` - Hook for AI API interactions
      - `useFlashcardAI.ts` - Hook for flashcard-specific AI features
    - `/types`
      - `index.ts` - AI feature type definitions
  - `/auth` - Authentication
    - `/hooks`
    - `/components`
  - `/premium` - Premium features
    - `/components`
      - `PremiumFeature.tsx` - Premium feature wrapper
    - `/constants`
      - `pricing.ts` - Subscription plan definitions
    - `/hooks`
      - `useSubscription.ts` - Subscription management hook
    - `/services`
      - `subscriptionService.ts` - Subscription API service
      - `premiumManagementService.ts` - Premium status management
  - `/cards`
    - `/components`
      - `ClassicCard.tsx` - Traditional flashcard component
      - `TrueFalseCard.tsx` - True/False statement cards
      - `MultipleChoiceCard.tsx` - Multiple choice drag-drop cards
      - `CardFactory.tsx` - Factory pattern for card creation
    - `/hooks`
      - `useCardInteraction.ts` - Shared card interaction logic
      - `useDragDrop.ts` - Drag and drop functionality
    - `/types`
      - `cards.ts` - Card type definitions
    - `/utils`
      - `cardValidation.ts` - Card validation utilities
      - `dragDropHelpers.ts` - Drag and drop helper functions

## Libraries and Utils

- `/lib` - Shared libraries and utilities
  - `/supabase` - Supabase client and utilities
  - `/utils` - Helper functions

## Components

- `/components` - Shared UI components
  - `HeaderBar.tsx`
  - Other reusable components...

## Documentation

- `/docs` - Project documentation
  - `CONTEXT.md` - Project structure and context
  - Other documentation files...

## Learning Flow

### Study Modes

#### 1. Review Mode (Default)

- Classic flashcard experience with intuitive gestures
- Tap to reveal answer
- Swipe right for correct, left for incorrect
- Progress tracking and performance metrics
- Available to all users

#### 5. Random Mode

- Cross-category learning

### Learning Process Flow

1. **Category Selection**

   - Browse personal categories

   - View progress indicators

2. **Mode Selection**

   - Choose preferred study mode
   - Set session duration
   - Configure mode-specific settings
   - View mode recommendations (Premium)

3. **Study Session**

   - Active recall practice
   - Performance tracking
   - Real-time feedback
   - Progress indicators
   - Streak monitoring

4. **Session Summary**

   - Detailed performance metrics
   - ✅ Correct/incorrect ratio
   - ⏱️ Time per card analysis
   - 📊 Progress visualization
   - 🎯 Achievement updates

### Enhanced Features

#### Accessibility

- Customizable text sizing
- Text-to-speech support
- High contrast modes
- Gesture customization (swipe, tap, etc.)

#### Gamification

- Daily/weekly streaks
- Achievement system
- Progress milestones

#### after you create a file add it in the context.md file so you know the directory structure

This learning flow is designed to maximize engagement and effectiveness while providing flexibility for different learning styles and needs. The premium features enhance the experience through AI-powered personalization and advanced analytics.
