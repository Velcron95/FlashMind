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

- Manual creation of flashcards with terms and definitions
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
- Unlimited flashcards and categories
- Advanced progress tracking
- Ad-free experience
- Personalized study recommendations
- Monthly or yearly subscription options
- Advanced collaboration features
- Complete cross-device sync

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
- term: string
- definition: text
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

#### study_groups

- id: uuid (PK)
- name: string
- created_by: uuid (FK -> users.id)
- created_at: timestamp
- description: text

#### group_members

- group_id: uuid (FK -> study_groups.id)
- user_id: uuid (FK -> users.id)
- joined_at: timestamp
- role: string

## Project Structure
