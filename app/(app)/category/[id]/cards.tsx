import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Text,
  Surface,
  IconButton,
  ActivityIndicator,
  Searchbar,
  Menu,
  Divider,
  Button,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase/supabaseClient";
import { getCardContent } from "@/features/cards/utils/cardHelpers";
import type { Flashcard } from "@/features/cards/types/cards";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = 470; // Decreased from 550 to 470
const CARD_PADDING = 20;
const MAX_OPTIONS = 4;

type GroupedCards = {
  classic: Flashcard[];
  true_false: Flashcard[];
  multiple_choice: Flashcard[];
};

export default function CategoryCardsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deletingMode, setDeletingMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  const fetchCards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("category_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlashcards(data || []);
    } catch (error) {
      console.error("[CategoryCards] Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCards();
    }, [id])
  );

  const handleDelete = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from("flashcards")
        .delete()
        .eq("id", cardId);
      if (error) throw error;
      await fetchCards();
    } catch (error) {
      console.error("[CategoryCards] Error deleting card:", error);
    }
  };

  const handleCardPress = (cardId: string) => {
    if (deletingMode) {
      setSelectedCards((prev) => {
        const newSelection = new Set(prev);
        if (newSelection.has(cardId)) {
          newSelection.delete(cardId);
          if (newSelection.size === 0) {
            setDeletingMode(false);
          }
        } else {
          newSelection.add(cardId);
        }
        return newSelection;
      });
    } else {
      router.push(`/flashcard/edit/${cardId}`);
    }
  };

  const handleLongPress = (cardId: string) => {
    setDeletingMode(true);
    setSelectedCards(new Set([cardId]));
  };

  const handleDeleteSelected = async () => {
    try {
      const { error } = await supabase
        .from("flashcards")
        .delete()
        .in("id", Array.from(selectedCards));

      if (error) throw error;

      setDeletingMode(false);
      setSelectedCards(new Set());
      fetchCards();
    } catch (error) {
      console.error("Error deleting cards:", error);
      Alert.alert("Error", "Failed to delete selected cards");
    }
  };

  const filteredCards = flashcards.filter((card) => {
    const content = getCardContent(card);
    const searchLower = searchQuery.toLowerCase();
    return (
      content.title.toLowerCase().includes(searchLower) ||
      content.content.toLowerCase().includes(searchLower)
    );
  });

  const groupedCards: GroupedCards = {
    classic: filteredCards.filter((card) => card.card_type === "classic"),
    true_false: filteredCards.filter((card) => card.card_type === "true_false"),
    multiple_choice: filteredCards.filter(
      (card) => card.card_type === "multiple_choice"
    ),
  };

  const renderCard = (item: Flashcard) => {
    const content = getCardContent(item);

    const renderCardContent = () => {
      switch (item.card_type) {
        case "classic":
          return (
            <View style={styles.cardInner}>
              <View style={styles.cardBody}>
                <View style={styles.termSection}>
                  <Text style={styles.cardText} numberOfLines={2}>
                    {item.term}
                  </Text>
                </View>
                <View style={styles.definitionSection}>
                  <Text style={styles.cardSubtext} numberOfLines={3}>
                    {item.definition}
                  </Text>
                </View>
              </View>
            </View>
          );

        case "true_false":
          return (
            <View style={styles.cardInner}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.answerBadge,
                    {
                      backgroundColor:
                        item.correct_answer === "true" ? "#E8F5E9" : "#FFEBEE",
                      borderColor:
                        item.correct_answer === "true" ? "#81C784" : "#E57373",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.answerText,
                      {
                        color:
                          item.correct_answer === "true"
                            ? "#2E7D32"
                            : "#C62828",
                      },
                    ]}
                  >
                    {item.correct_answer.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.statementSection}>
                  <Text style={styles.cardText} numberOfLines={4}>
                    {item.statement}
                  </Text>
                </View>
              </View>
            </View>
          );

        case "multiple_choice":
          return (
            <View style={styles.cardInner}>
              <View style={styles.cardBody}>
                <View style={styles.questionSection}>
                  <Text style={styles.cardText} numberOfLines={2}>
                    {item.question}
                  </Text>
                </View>
                <View style={styles.optionsSection}>
                  {item.options?.slice(0, 4).map((option, index) => (
                    <View
                      key={index}
                      style={[
                        styles.optionItem,
                        option === item.correct_answer && styles.correctOption,
                      ]}
                    >
                      <Text style={styles.optionText} numberOfLines={1}>
                        {option}
                      </Text>
                      {option === item.correct_answer && (
                        <IconButton
                          icon="check"
                          size={18}
                          iconColor="#2E7D32"
                        />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
      }
    };

    return (
      <Surface key={item.id} style={styles.card} elevation={3}>
        <TouchableOpacity
          style={[
            styles.cardContainer,
            selectedCards.has(item.id) && styles.selectedCard,
          ]}
          onLongPress={() => handleLongPress(item.id)}
          onPress={() => handleCardPress(item.id)}
        >
          {deletingMode && (
            <View style={styles.checkboxContainer}>
              <IconButton
                icon={
                  selectedCards.has(item.id)
                    ? "checkbox-marked"
                    : "checkbox-blank-outline"
                }
                iconColor="white"
                size={24}
              />
            </View>
          )}
          <LinearGradient
            colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.1)"]}
            style={styles.cardGradient}
          >
            {renderCardContent()}
            <Menu
              visible={menuVisible === item.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  iconColor="rgba(255,255,255,0.7)"
                  style={styles.menuButton}
                  onPress={() => setMenuVisible(item.id)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  router.push(`/flashcard/edit/${item.id}`);
                  setMenuVisible(null);
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  handleDelete(item.id);
                  setMenuVisible(null);
                }}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          </LinearGradient>
        </TouchableOpacity>
      </Surface>
    );
  };

  const renderCardSection = (title: string, cards: Flashcard[]) => {
    if (cards.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>{cards.length} cards</Text>
        </View>
        {cards.map(renderCard)}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#FF6B6B", "#4158D0"]} style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search cards..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={{ color: "white" }}
          iconColor="rgba(255,255,255,0.7)"
          placeholderTextColor="rgba(255,255,255,0.5)"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {deletingMode && (
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionText}>
              {selectedCards.size} selected
            </Text>
          </View>
        )}

        {renderCardSection("Classic Flashcards", groupedCards.classic)}
        {renderCardSection("True/False Questions", groupedCards.true_false)}
        {renderCardSection(
          "Multiple Choice Questions",
          groupedCards.multiple_choice
        )}

        {filteredCards.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No cards found</Text>
            <Text style={styles.emptySubtext}>
              Add some cards to start studying
            </Text>
          </View>
        )}

        {deletingMode && <View style={{ height: 80 }} />}
      </ScrollView>

      {deletingMode && (
        <View style={styles.deleteActions}>
          <Button
            mode="outlined"
            onPress={() => {
              setDeletingMode(false);
              setSelectedCards(new Set());
            }}
            style={styles.cancelButton}
            textColor="white"
            labelStyle={styles.buttonLabel}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleDeleteSelected}
            style={styles.deleteButton}
            buttonColor="rgba(255,82,82,0.9)"
            labelStyle={styles.buttonLabel}
          >
            Delete ({selectedCards.size})
          </Button>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 16,
    paddingTop: 48,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchbar: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  section: {
    marginBottom: 32,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
    paddingBottom: 16,
  },
  sectionTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    opacity: 0.95,
  },
  sectionCount: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
  },
  card: {
    backgroundColor: "white",
    height: CARD_HEIGHT,
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  cardContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
  },
  cardInner: {
    flex: 1,
    padding: 20,
    paddingBottom: 24,
  },
  cardBody: {
    flex: 1,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  cardType: {
    color: "#1976D2",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontWeight: "600",
  },
  answerBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
  },
  cardText: {
    color: "#1A1A1A",
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 30,
  },
  cardDivider: {
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 12,
  },
  cardAnswer: {
    backgroundColor: "#F8F9FA",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginTop: "auto",
  },
  cardAnswerLabel: {
    color: "#757575",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
    fontWeight: "600",
  },
  cardSubtext: {
    color: "#424242",
    fontSize: 20,
    lineHeight: 28,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  cardGradient: {
    flex: 1,
    padding: 20,
  },
  cardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5F5F5",
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cardStatText: {
    color: "#757575",
    fontSize: 13,
    fontWeight: "500",
  },
  optionsContainer: {
    gap: 12,
    marginTop: 12,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 16,
    paddingLeft: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    height: 60,
    marginHorizontal: 2,
    elevation: 1,
  },
  correctOption: {
    backgroundColor: "#E8F5E9",
    borderColor: "#81C784",
    borderWidth: 2,
  },
  optionText: {
    color: "#424242",
    fontSize: 18,
    flex: 1,
    marginRight: 8,
  },
  menuButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "white",
    borderRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  termContainer: {
    backgroundColor: "#F8F9FA",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cardLabel: {
    color: "#757575",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: "600",
  },
  learnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#81C784",
  },
  learnedText: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  termSection: {
    backgroundColor: "#F8F9FA",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 14,
  },
  definitionSection: {
    backgroundColor: "#F8F9FA",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flex: 1,
  },
  statementSection: {
    backgroundColor: "#F8F9FA",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flex: 1,
  },
  questionSection: {
    backgroundColor: "#F8F9FA",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 24,
  },
  optionsSection: {
    gap: 16,
    flex: 1,
    paddingBottom: 8,
  },
  answerText: {
    fontSize: 13,
    fontWeight: "600",
  },
  selectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    marginBottom: 16,
  },
  selectionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  selectedCard: {
    backgroundColor: "rgba(255,82,82,0.15)",
    borderWidth: 2,
    borderColor: "rgba(255,82,82,0.4)",
  },
  checkboxContainer: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
    backgroundColor: "rgba(255,82,82,0.9)",
    borderRadius: 20,
    padding: 4,
  },
  deleteActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: "rgba(0,0,0,0.9)",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    elevation: 8,
  },
  deleteButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
