-- Add spaced repetition fields to flashcards table
ALTER TABLE flashcards
ADD COLUMN next_review TIMESTAMP WITH TIME ZONE,
ADD COLUMN review_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN difficulty_level DOUBLE PRECISION NOT NULL DEFAULT 2.5;

-- Update existing records
UPDATE flashcards
SET next_review = NULL,
    review_count = 0,
    difficulty_level = 2.5
WHERE next_review IS NULL; 