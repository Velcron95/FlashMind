import type { Flashcard } from "../types/cards";

export const getCardContent = (card: Flashcard) => {
  switch (card.card_type) {
    case "classic":
      return {
        title: card.term,
        content: card.definition,
      };
    case "true_false":
      return {
        title: "True/False",
        content: card.statement,
      };
    case "multiple_choice":
      return {
        title: card.question,
        content: card.options.join(", "),
      };
    default:
      return {
        title: "",
        content: "",
      };
  }
};

export const filterCardsByType = (cards: Flashcard[], type: CardType) => {
  return cards.filter((card) => card.card_type === type);
};

type CardType = "classic" | "multiple_choice" | "true_false";
