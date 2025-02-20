# FlashMind - Smart Flashcard App

## Overview

FlashMind is a flashcard application designed to help users create and study flashcards with ease. The app provides an intuitive, clean interface with a token-based system for purchasing pre-made categories.

## Tech Stack:

Frontend: React Native with TypeScript, Expo, and Expo Router
Backend/Database: Supabase
UI Framework: React Native Paper

## Core Features

### Authentication

- Email-based signup and login via Supabase
- Secure user authentication and session management
- 100 tokens awarded upon signup (enough to purchase one category)

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
- Search functionality across all categories
- Advanced filtering options (difficulty, last studied, etc.)

### User Experience

- Daily/weekly study streaks

### Token System

- Initial 100 tokens upon account creation
  - Allows new users to immediately purchase one category (100 tokens) or
  - Generate up to 100 AI flashcards (1 token each)
- Token usage:
  - AI flashcard generation (1 token per card)
  - Purchase pre-made categories (100 tokens per category)
- Token packages:
  - 50 tokens → $2.99
  - 100 tokens → $5.49
  - 250 tokens → $11.49
  - 500 tokens → $21.99

## Monetization

### Free Tier

- Basic flashcard creation and management
- Manual category organization
- Limited features with ads
- Basic search and filter functionality

## Database Schema

### Tables

#### users

- id: uuid (PK)
- email: string (unique)
- created_at: timestamp
- last_login: timestamp
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

#### profiles

- id: uuid (PK)
- email: string
- streak_count: integer
- last_study_date: timestamp
- created_at: timestamp
- updated_at: timestamp
- token_balance: integer

#### user_tokens

- id: uuid (PK)
- user_id: uuid (FK -> users.id)
- token_balance: integer
- last_updated: timestamp

#### token_transactions

- id: uuid (PK)
- user_id: uuid (FK -> users.id)
- amount: integer
- transaction_type: enum ('purchase', 'spend', 'reward')
- description: text
- created_at: timestamp

#### store_categories

- id: uuid (PK)
- name: string
- description: text
- preview_cards: jsonb[] // Sample cards of each type
- cards: jsonb {
  classic: Array<{term: string, definition: string}>,
  true_false: Array<{statement: string, correct_answer: string}>,
  multiple_choice: Array<{question: string, options: string[], correct_answer: string}>
  }
- token_cost: integer
- category_type: string
- difficulty_level: string
- created_at: timestamp
- updated_at: timestamp

#### purchased_categories

- id: uuid (PK)
- user_id: uuid (FK -> users.id)
- store_category_id: uuid (FK -> store_categories.id)
- purchase_date: timestamp
- transaction_id: uuid (FK -> token_transactions.id)
- is_active: boolean

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
      - `TrueFalseCard.tsx`
