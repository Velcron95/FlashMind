import React from "react";
import { ClassicCard } from "./ClassicCard";
import { TrueFalseCard } from "./TrueFalseCard";
import { MultipleChoiceCard } from "./MultipleChoiceCard";
import type { Flashcard } from "../types/cards";

interface CardFactoryProps {
  card: Flashcard;
  onFlip?: () => void;
  onSwipe?: (direction: "left" | "right") => void;
  onAnswer?: (isCorrect: boolean) => void;
  isFlipped?: boolean;
}

export const CardFactory: React.FC<CardFactoryProps> = ({
  card,
  onFlip,
  onSwipe,
  onAnswer,
  isFlipped,
}) => {
  switch (card.card_type) {
    case "classic":
      return (
        <ClassicCard
          card={card}
          onFlip={onFlip}
          onSwipe={onSwipe}
          isFlipped={isFlipped}
        />
      );
    case "true_false":
      return <TrueFalseCard card={card} onAnswer={onAnswer} />;
    case "multiple_choice":
      return <MultipleChoiceCard card={card} onAnswer={onAnswer} />;
    default:
      console.error("Unknown card type:", (card as any).card_type);
      return null;
  }
};
