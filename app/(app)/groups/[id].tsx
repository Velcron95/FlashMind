import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  Text,
  Card,
  Button,
  IconButton,
  Menu,
  Portal,
  Dialog,
  TextInput,
  HelperText,
  Avatar,
  List,
  useTheme,
  Divider,
  FAB,
  Checkbox,
} from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../../lib/supabase/supabaseClient";

interface GroupMember {
  id: string;
  user_id: string;
  email: string;
  is_owner: boolean;
  joined_at: string;
}

interface SharedFlashcard {
  id: string;
  term: string;
  definition: string;
  shared_by: string;
  shared_at: string;
}

interface SupabaseMemberResponse {
  id: string;
  user_id: string;
  is_owner: boolean;
  joined_at: string;
  users: {
    email: string;
  };
}

interface SupabaseCardResponse {
  id: string;
  term: string;
  definition: string;
  shared_at: string;
  users: {
    email: string;
  };
}

interface Flashcard {
  id: string;
  term: string;
  definition: string;
  deck_id: string;
}

interface Deck {
  id: string;
  name: string;
  description: string;
}

export default function GroupDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams();
  const [group, setGroup] = useState<{
    name: string;
    description: string;
    created_at: string;
  } | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [sharedCards, setSharedCards] = useState<SharedFlashcard[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [availableCards, setAvailableCards] = useState<Flashcard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [showDeckDialog, setShowDeckDialog] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SharedFlashcard | null>(
    null
  );
  const [decks, setDecks] = useState<Deck[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from("study_groups")
        .select("*")
        .eq("id", id)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Fetch members with proper typing
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select(
          `
          id,
          user_id,
          is_owner,
          joined_at,
          users:users (email)
        `
        )
        .eq("group_id", id);

      if (membersError) throw membersError;

      // Cast and transform the data
      const processedMembers = (
        (membersData || []) as unknown as SupabaseMemberResponse[]
      ).map((member) => ({
        id: member.id,
        user_id: member.user_id,
        email: member.users.email,
        is_owner: member.is_owner,
        joined_at: member.joined_at,
      }));
      setMembers(processedMembers);

      // Check if current user is owner
      const currentMember = processedMembers.find((m) => m.user_id === user.id);
      setIsOwner(currentMember?.is_owner || false);

      // Fetch shared flashcards with proper typing
      const { data: cardsData, error: cardsError } = await supabase
        .from("shared_flashcards")
        .select(
          `
          id,
          term,
          definition,
          shared_at,
          users:users (email)
        `
        )
        .eq("group_id", id);

      if (cardsError) throw cardsError;

      // Cast and transform the data
      setSharedCards(
        ((cardsData || []) as unknown as SupabaseCardResponse[]).map(
          (card) => ({
            id: card.id,
            term: card.term,
            definition: card.definition,
            shared_by: card.users.email,
            shared_at: card.shared_at,
          })
        )
      );
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to load group details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", inviteEmail.trim())
        .single();

      if (userError) throw new Error("User not found");

      // Add member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: id,
          user_id: userData.id,
          is_owner: false,
        });

      if (memberError) throw memberError;

      setShowInviteDialog(false);
      setInviteEmail("");
      fetchGroupDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const { error: leaveError } = await supabase
              .from("group_members")
              .delete()
              .eq("group_id", id)
              .eq("user_id", user.id);

            if (leaveError) throw leaveError;

            router.back();
          } catch (err) {
            Alert.alert(
              "Error",
              err instanceof Error ? err.message : "Failed to leave group"
            );
          }
        },
      },
    ]);
  };

  const fetchAvailableCards = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data, error } = await supabase
        .from("flashcards")
        .select("id, term, definition, deck_id")
        .eq("user_id", user.id)
        .not("id", "in", `(${sharedCards.map((c) => c.id).join(",")})`);

      if (error) throw error;
      setAvailableCards(data || []);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to load flashcards"
      );
    }
  };

  const handleShareCards = async () => {
    if (selectedCards.length === 0) {
      Alert.alert("Error", "Please select at least one flashcard to share");
      return;
    }

    setSharingLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const sharesToCreate = selectedCards.map((cardId) => ({
        group_id: id,
        flashcard_id: cardId,
        shared_by: user.id,
      }));

      const { error } = await supabase
        .from("shared_flashcards")
        .insert(sharesToCreate);

      if (error) throw error;

      setShowShareDialog(false);
      setSelectedCards([]);
      fetchGroupDetails(); // Refresh the shared cards list
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to share flashcards"
      );
    } finally {
      setSharingLoading(false);
    }
  };

  const fetchDecks = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data, error } = await supabase
        .from("decks")
        .select("id, name, description")
        .eq("user_id", user.id);

      if (error) throw error;
      setDecks(data || []);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to load decks"
      );
    }
  };

  const handleImportCard = async (deckId: string) => {
    if (!selectedCard) return;

    setImportLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Create new flashcard
      const { error: cardError } = await supabase.from("flashcards").insert({
        term: selectedCard.term,
        definition: selectedCard.definition,
        deck_id: deckId,
        user_id: user.id,
      });

      if (cardError) throw cardError;

      setShowDeckDialog(false);
      setSelectedCard(null);
      Alert.alert("Success", "Card imported successfully");
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to import card"
      );
    } finally {
      setImportLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <Text variant="headlineMedium" style={styles.title}>
            {group?.name}
          </Text>
          <IconButton
            icon="chat"
            onPress={() => router.push(`/groups/${id}/chat`)}
          />
          {isOwner && (
            <Menu
              visible={showMenu}
              onDismiss={() => setShowMenu(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setShowMenu(true)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setShowMenu(false);
                  setShowInviteDialog(true);
                }}
                title="Invite Member"
              />
              <Menu.Item
                onPress={() => {
                  setShowMenu(false);
                  router.push(`/groups/${id}/edit`);
                }}
                title="Edit Group"
              />
              <Menu.Item
                onPress={() => {
                  setShowMenu(false);
                  handleLeaveGroup();
                }}
                title="Delete Group"
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          )}
        </View>

        <Text variant="bodyMedium" style={styles.description}>
          {group?.description}
        </Text>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          Members ({members.length})
        </Text>
        {members.map((member) => (
          <List.Item
            key={member.id}
            title={member.email}
            left={(props) => (
              <Avatar.Text
                {...props}
                label={member.email.substring(0, 2).toUpperCase()}
              />
            )}
            right={(props) =>
              member.is_owner && (
                <Button {...props} mode="text" icon="crown">
                  Owner
                </Button>
              )
            }
          />
        ))}

        <Divider style={styles.divider} />

        <Text variant="titleLarge" style={styles.sectionTitle}>
          Shared Flashcards ({sharedCards.length})
        </Text>
        {sharedCards.map((card) => (
          <Card key={card.id} style={styles.card}>
            <Card.Title
              title={card.term}
              subtitle={`Shared by ${card.shared_by}`}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="download"
                  onPress={() => {
                    setSelectedCard(card);
                    fetchDecks();
                    setShowDeckDialog(true);
                  }}
                />
              )}
            />
            <Card.Content>
              <Text variant="bodyMedium">{card.definition}</Text>
            </Card.Content>
          </Card>
        ))}

        {!isOwner && (
          <Button
            mode="outlined"
            onPress={handleLeaveGroup}
            style={styles.leaveButton}
            textColor={theme.colors.error}
          >
            Leave Group
          </Button>
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={showInviteDialog}
          onDismiss={() => setShowInviteDialog(false)}
        >
          <Dialog.Title>Invite Member</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Email"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            {error && (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowInviteDialog(false)}>Cancel</Button>
            <Button
              onPress={handleInviteMember}
              loading={loading}
              disabled={loading}
            >
              Invite
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showShareDialog}
          onDismiss={() => setShowShareDialog(false)}
        >
          <Dialog.Title>Share Flashcards</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <ScrollView>
              {availableCards.map((card) => (
                <List.Item
                  key={card.id}
                  title={card.term}
                  description={card.definition}
                  left={(props) => (
                    <Checkbox.Android
                      {...props}
                      status={
                        selectedCards.includes(card.id)
                          ? "checked"
                          : "unchecked"
                      }
                      onPress={() => {
                        setSelectedCards((prev) =>
                          prev.includes(card.id)
                            ? prev.filter((id) => id !== card.id)
                            : [...prev, card.id]
                        );
                      }}
                    />
                  )}
                />
              ))}
              {availableCards.length === 0 && (
                <Text style={styles.noCards}>
                  No flashcards available to share
                </Text>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowShareDialog(false)}>Cancel</Button>
            <Button
              onPress={handleShareCards}
              loading={sharingLoading}
              disabled={sharingLoading || selectedCards.length === 0}
            >
              Share
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showDeckDialog}
          onDismiss={() => setShowDeckDialog(false)}
        >
          <Dialog.Title>Select Deck</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <ScrollView>
              {decks.map((deck) => (
                <List.Item
                  key={deck.id}
                  title={deck.name}
                  description={deck.description}
                  onPress={() => handleImportCard(deck.id)}
                  right={(props) =>
                    importLoading && <ActivityIndicator {...props} />
                  }
                />
              ))}
              {decks.length === 0 && (
                <Text style={styles.noCards}>
                  Create a deck first to import cards
                </Text>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowDeckDialog(false)}>Cancel</Button>
            <Button
              onPress={() => {
                setShowDeckDialog(false);
                router.push("/create");
              }}
            >
              Create Deck
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon="share"
        label="Share Cards"
        style={styles.shareFab}
        onPress={() => {
          fetchAvailableCards();
          setShowShareDialog(true);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    flex: 1,
    marginLeft: 8,
  },
  description: {
    marginBottom: 24,
    opacity: 0.7,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 24,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  leaveButton: {
    marginTop: 24,
    borderColor: "red",
  },
  shareFab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dialogScroll: {
    maxHeight: 400,
  },
  noCards: {
    textAlign: "center",
    opacity: 0.7,
    padding: 16,
  },
});
