/**
 * CategoryDetailScreen - Individual category view with flashcards
 * Route: /category/[id]
 */
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  PanResponder,
} from "react-native";
import {
  Text,
  Card,
  FAB,
  useTheme,
  IconButton,
  Menu,
  Searchbar,
  Button,
  ActivityIndicator,
  Surface,
  SegmentedButtons,
} from "react-native-paper";
import PagerView from "react-native-pager-view";
import { useFocusEffect, router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase/supabaseClient";
import type { Category } from "@/types/database";
import type { Flashcard } from "@/features/cards/types/cards";
import { LinearGradient } from "expo-linear-gradient";
import { CategorySections } from "@/features/cards/components/CategorySections";
import { getCardContent } from "@/features/cards/utils/cardHelpers";
import { useCardActions } from "@/features/cards/hooks/useCardActions";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.65;
const CARD_HEIGHT = CARD_WIDTH * 1.2;

// Add a type for the card types
type CardType = "classic" | "multiple_choice" | "true_false" | "all";

const FlashcardCard = ({
  flashcard,
  onMenuPress,
  menuVisible,
  onDelete,
}: {
  flashcard: Flashcard;
  onMenuPress: () => void;
  menuVisible: boolean;
  onDelete: (id: string) => void;
}) => {
  const { title, content } = getCardContent(flashcard);

  return (
    <View style={styles.cardWrapper}>
      <Surface style={styles.cardSurface} elevation={3}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text variant="titleLarge" style={styles.cardTerm}>
              {title}
            </Text>
            <Menu
              visible={menuVisible}
              onDismiss={onMenuPress}
              anchor={<IconButton icon="dots-vertical" onPress={onMenuPress} />}
            >
              <Menu.Item
                onPress={() => {
                  onMenuPress();
                  router.push(`/(app)/flashcard/edit/${flashcard.id}`);
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  onMenuPress();
                  onDelete(flashcard.id);
                }}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          </View>
          <Text style={styles.cardDefinition} numberOfLines={3}>
            {content}
          </Text>
        </View>
      </Surface>
    </View>
  );
};

const FlashcardCarousel = ({
  flashcards,
  onMenuPress,
  menuVisible,
  onDelete,
}: {
  flashcards: Flashcard[];
  onMenuPress: (id: string | null) => void;
  menuVisible: string | null;
  onDelete: (id: string) => void;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPageSelected = (e: any) => {
    setActiveIndex(e.nativeEvent.position);
  };

  return (
    <View style={styles.carouselContainer}>
      <Text style={styles.cardCount}>
        {activeIndex + 1} / {flashcards.length}
      </Text>

      <PagerView
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={onPageSelected}
        pageMargin={20}
        overdrag={true}
        layoutDirection="ltr"
      >
        {flashcards.map((flashcard) => (
          <View key={flashcard.id} style={styles.pageContainer}>
            <FlashcardCard
              flashcard={flashcard}
              onMenuPress={() => onMenuPress(flashcard.id)}
              menuVisible={menuVisible === flashcard.id}
              onDelete={onDelete}
            />
          </View>
        ))}
      </PagerView>
    </View>
  );
};

const CardTypeSelector = ({
  selectedType,
  setSelectedType,
}: {
  selectedType: CardType;
  setSelectedType: (value: CardType) => void;
}) => (
  <Surface style={styles.selectorContainer}>
    <SegmentedButtons
      value={selectedType}
      onValueChange={(value) => setSelectedType(value as CardType)}
      buttons={[
        {
          value: "all",
          label: "All",
          icon: "cards",
          style: styles.segmentButton,
          showSelectedCheck: false,
        },
        {
          value: "classic",
          label: "Basic",
          icon: "card-text",
          style: styles.segmentButton,
          showSelectedCheck: false,
        },
        {
          value: "true_false",
          label: "T/F",
          icon: "check-circle",
          style: styles.segmentButton,
          showSelectedCheck: false,
        },
        {
          value: "multiple_choice",
          label: "MCQ",
          icon: "format-list-bulleted",
          style: styles.segmentButton,
          showSelectedCheck: false,
        },
      ]}
      theme={{
        colors: {
          secondaryContainer: "rgba(255, 255, 255, 0.1)",
          onSecondaryContainer: "white",
          outline: "transparent",
        },
      }}
      style={styles.segmentedButtonGroup}
    />
  </Surface>
);

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [category, setCategory] = useState<Category | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [selectedCardType, setSelectedCardType] = useState<CardType>("all");

  const cardTypeSegments = [
    { value: "classic", label: "Basic" },
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "true_false", label: "True/False" },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("[CategoryDetail] Fetching data for category:", id);

      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      if (categoryError) {
        console.error(
          "[CategoryDetail] Error fetching category:",
          categoryError
        );
        throw categoryError;
      }
      console.log("[CategoryDetail] Category data:", categoryData);
      setCategory(categoryData);

      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("category_id", id)
        .order("created_at", { ascending: false });

      if (flashcardsError) {
        console.error(
          "[CategoryDetail] Error fetching flashcards:",
          flashcardsError
        );
        throw flashcardsError;
      }
      console.log(
        "[CategoryDetail] Fetched flashcards:",
        flashcardsData?.length
      );
      setFlashcards(flashcardsData || []);
    } catch (error) {
      console.error("[CategoryDetail] Error in fetchData:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [id])
  );

  const handleDeleteFlashcard = async (flashcardId: string) => {
    try {
      const { error } = await supabase
        .from("flashcards")
        .delete()
        .eq("id", flashcardId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error("Error deleting flashcard:", error);
    }
  };

  if (loading || !category) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const filteredFlashcards = flashcards.filter((card) => {
    const { title, content } = getCardContent(card);
    const searchLower = searchQuery.toLowerCase();
    return (
      title.toLowerCase().includes(searchLower) ||
      content.toLowerCase().includes(searchLower)
    );
  });

  return (
    <LinearGradient
      colors={["#FF6B6B", "#4158D0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Text variant="headlineMedium" style={styles.title}>
              {category.name}
            </Text>
            <IconButton
              icon="pencil"
              mode="contained"
              containerColor="rgba(255,255,255,0.15)"
              iconColor="white"
              size={20}
              onPress={() => router.push(`/(app)/category/edit/${id}`)}
            />
          </View>
          <Button
            mode="contained"
            onPress={() => router.push(`/study/${id}`)}
            style={styles.studyButton}
            buttonColor="rgba(255,255,255,0.15)"
            textColor="white"
            icon="book-open-variant"
          >
            Study
          </Button>
        </View>

        <Searchbar
          placeholder="Search cards..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="rgba(255,255,255,0.7)"
          placeholderTextColor="rgba(255,255,255,0.5)"
          inputStyle={styles.searchInput}
        />

        <CardTypeSelector
          selectedType={selectedCardType}
          setSelectedType={setSelectedCardType}
        />
      </View>

      <View style={styles.content}>
        <FlashcardCarousel
          flashcards={filteredFlashcards.filter(
            (card) =>
              selectedCardType === "all" || card.card_type === selectedCardType
          )}
          onMenuPress={setMenuVisible}
          menuVisible={menuVisible}
          onDelete={handleDeleteFlashcard}
        />
      </View>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          try {
            const createUrl = `/(app)/flashcard/create/${id}?type=${selectedCardType}`;
            console.log("[CategoryDetail] Creating card:", {
              categoryId: id,
              cardType: selectedCardType,
              url: createUrl,
              timestamp: new Date().toISOString(),
            });
            router.push(createUrl);
          } catch (error) {
            console.error("[CategoryDetail] Failed to create card:", {
              error,
              categoryId: id,
              cardType: selectedCardType,
              errorMessage:
                error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date().toISOString(),
            });
          }
        }}
        label="Add Card"
        customSize={56}
      />
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
    paddingTop: 24,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  title: {
    color: "white",
    fontWeight: "bold",
    flex: 1,
  },
  studyButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  searchBar: {
    elevation: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  searchInput: {
    color: "white",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  segmentedButtons: {
    marginTop: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 16,
    bottom: 16,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  carouselContainer: {
    height: CARD_HEIGHT + 40,
    marginVertical: 12,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardSurface: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "white",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTerm: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  cardDefinition: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    flex: 1,
  },
  cardCount: {
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
    opacity: 0.7,
  },
  selectorContainer: {
    marginHorizontal: 0,
    marginVertical: 8,
    backgroundColor: "transparent",
    elevation: 0,
    borderRadius: 12,
  },
  segmentButton: {
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 0,
  },
  segmentedButtonGroup: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
});
