import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  Card,
  Button,
  FAB,
  Portal,
  Dialog,
  TextInput,
  HelperText,
  Avatar,
  List,
  useTheme,
} from "react-native-paper";
import { router } from "expo-router";
import { supabase } from "../../../lib/supabase/supabaseClient";
import { usePremium } from "../../../hooks/usePremium";

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  member_count: number;
  is_owner: boolean;
  created_at: string;
}

export default function GroupsScreen() {
  const theme = useTheme();
  const { isPremium } = usePremium();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data, error: fetchError } = await supabase
        .from("study_groups")
        .select(
          `
          id,
          name,
          description,
          created_at,
          members:group_members(count),
          is_owner:group_members!inner(is_owner)
        `
        )
        .eq("group_members.user_id", user.id);

      if (fetchError) throw fetchError;

      setGroups(
        data?.map((group) => ({
          ...group,
          member_count: group.members[0].count,
          is_owner: group.is_owner[0].is_owner,
        })) || []
      );
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to load groups"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!isPremium) {
      Alert.alert(
        "Premium Feature",
        "Creating study groups is a premium feature. Upgrade to continue."
      );
      return;
    }

    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Create group
      const { data: group, error: createError } = await supabase
        .from("study_groups")
        .insert({
          name: groupName.trim(),
          description: groupDescription.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
          is_owner: true,
        });

      if (memberError) throw memberError;

      setShowCreateDialog(false);
      setGroupName("");
      setGroupDescription("");
      fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Study Groups
        </Text>

        {groups.map((group) => (
          <Card
            key={group.id}
            style={styles.card}
            onPress={() => router.push(`/groups/${group.id}`)}
          >
            <Card.Title
              title={group.name}
              subtitle={`${group.member_count} members`}
              left={(props) => (
                <Avatar.Text
                  {...props}
                  label={group.name.substring(0, 2).toUpperCase()}
                />
              )}
              right={(props) =>
                group.is_owner && (
                  <Button {...props} mode="text" icon="crown">
                    Owner
                  </Button>
                )
              }
            />
            <Card.Content>
              <Text variant="bodyMedium" numberOfLines={2}>
                {group.description}
              </Text>
            </Card.Content>
          </Card>
        ))}

        {groups.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text variant="bodyLarge">No study groups yet</Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              Create or join a study group to collaborate with others
            </Text>
          </View>
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={showCreateDialog}
          onDismiss={() => setShowCreateDialog(false)}
        >
          <Dialog.Title>Create Study Group</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Group Name"
              value={groupName}
              onChangeText={setGroupName}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Description"
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
            {error && (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              onPress={handleCreateGroup}
              loading={loading}
              disabled={loading}
            >
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowCreateDialog(true)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyDescription: {
    textAlign: "center",
    opacity: 0.7,
    marginTop: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
