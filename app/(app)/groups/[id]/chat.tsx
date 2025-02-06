import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Pressable,
  GestureResponderEvent,
  Image,
  Alert,
  Linking,
} from "react-native";
import {
  Text,
  TextInput,
  IconButton,
  Avatar,
  useTheme,
  ActivityIndicator,
  Menu,
  Portal,
  Dialog,
  Button,
  ProgressBar,
} from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../../../lib/supabase/supabaseClient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import ImageView from "react-native-image-viewing";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import { Image as ExpoImage } from "expo-image";

interface Reaction {
  emoji: string;
  users: string[]; // array of user IDs
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_email: string;
  reactions: { [key: string]: string[] }; // emoji -> user IDs
  attachment?: {
    url: string;
    type: "image" | "file";
    name?: string;
  };
}

interface SupabaseMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  users: {
    email: string;
  };
  reactions: { [key: string]: string[] };
}

interface TypingUser {
  id: string;
  email: string;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🎉", "👏"];

// Add constants for file limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "application/pdf": "file",
  "application/msword": "file",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "file",
} as const;

export default function GroupChatScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    };
    getCurrentUser();
    fetchMessages();
    subscribeToMessages();
    subscribeToTyping();

    return () => {
      // Clear typing status when leaving
      updateTypingStatus(false);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("group_messages")
        .select(
          `
          id,
          content,
          created_at,
          user_id,
          users:users (email),
          reactions:reactions (emoji)
        `
        )
        .eq("group_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(
        ((data || []) as unknown as SupabaseMessage[]).map((msg) => ({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          user_id: msg.user_id,
          user_email: msg.users.email,
          reactions: msg.reactions,
        }))
      );
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel("group_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${id}`,
        },
        async (payload) => {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("email")
            .eq("id", payload.new.user_id)
            .single();

          if (userError) return;

          const newMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            user_id: payload.new.user_id,
            user_email: userData.email,
            reactions: payload.new.reactions,
          };

          setMessages((prev) => [...prev, newMessage]);
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id
                ? { ...msg, content: payload.new.content }
                : msg
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const subscribeToTyping = () => {
    const subscription = supabase
      .channel("typing_status")
      .on(
        "broadcast",
        { event: "typing" },
        ({ payload }: { payload: { user: TypingUser; isTyping: boolean } }) => {
          if (payload.user.id === currentUserId) return;

          setTypingUsers((prev) => {
            if (payload.isTyping) {
              return [
                ...prev.filter((u) => u.id !== payload.user.id),
                payload.user,
              ];
            } else {
              return prev.filter((u) => u.id !== payload.user.id);
            }
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.channel("typing_status").send({
      type: "broadcast",
      event: "typing",
      payload: {
        user: {
          id: user.id,
          email: user.email,
        },
        isTyping,
      },
    });
  };

  const handleTextChange = (text: string) => {
    setNewMessage(text);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing status
    updateTypingStatus(true);

    // Clear typing status after 1.5 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 1500);
  };

  // Update the validateFile function with the correct type
  const validateFile = (file: DocumentPicker.DocumentPickerAsset) => {
    if (file.size && file.size > MAX_FILE_SIZE) {
      throw new Error("File size must be less than 10MB");
    }

    if (!file.mimeType || !(file.mimeType in ALLOWED_FILE_TYPES)) {
      throw new Error("File type not supported");
    }
  };

  const handleAttachment = async () => {
    try {
      setUploadProgress(0);
      const result = await DocumentPicker.getDocumentAsync({
        type: Object.keys(ALLOWED_FILE_TYPES),
        multiple: false,
      });

      if (result.canceled) return;
      const file = result.assets[0];

      // Validate file
      validateFile(file);
      setUploading(true);

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
      const fileExt = file.name.split(".").pop();
      const fullPath = `${fileName}.${fileExt}`;

      // Handle different file types
      if (file.mimeType?.startsWith("image/")) {
        // Existing image handling code
        const asset = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!asset.granted) {
          Alert.alert(
            "Permission needed",
            "Please grant permission to access your photos"
          );
          return;
        }

        const imageResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          base64: true,
        });

        if (!imageResult.canceled && imageResult.assets[0]) {
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("chat-attachments")
              .upload(
                `${id}/${fullPath}`,
                decode(imageResult.assets[0].base64!),
                {
                  contentType: file.mimeType,
                }
              );

          if (uploadError) throw uploadError;
        }
      } else {
        // Handle other file types
        const fileContent = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("chat-attachments")
          .upload(`${id}/${fullPath}`, decode(fileContent), {
            contentType: file.mimeType,
          });

        if (uploadError) throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(`${id}/${fullPath}`);

      // Send message with attachment
      await handleSend("", {
        url: publicUrl,
        type: file.mimeType?.startsWith("image/") ? "image" : "file",
        name: file.name,
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 0.99) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 0.1;
        });
      }, 100);

      clearInterval(progressInterval);
      setUploadProgress(1);
      setTimeout(() => setUploadProgress(0), 500); // Reset progress after a delay
    } catch (err) {
      console.error("Error uploading file:", err);
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to upload file"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (
    content: string = newMessage,
    attachment?: Message["attachment"]
  ) => {
    if (!content.trim() && !attachment) return;

    setSending(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase.from("group_messages").insert({
        content: content.trim(),
        group_id: id,
        user_id: user.id,
        attachment,
      });

      if (error) throw error;

      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      const { error } = await supabase
        .from("group_messages")
        .delete()
        .eq("id", selectedMessage.id)
        .eq("user_id", currentUserId);

      if (error) throw error;

      setMessages((prev) =>
        prev.filter((msg) => msg.id !== selectedMessage.id)
      );
      setShowMessageMenu(false);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const handleEditMessage = async () => {
    if (!selectedMessage || !editedContent.trim()) return;

    try {
      const { error } = await supabase
        .from("group_messages")
        .update({ content: editedContent.trim() })
        .eq("id", selectedMessage.id)
        .eq("user_id", currentUserId);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === selectedMessage.id
            ? { ...msg, content: editedContent.trim() }
            : msg
        )
      );
      setShowEditDialog(false);
      setShowMessageMenu(false);
    } catch (err) {
      console.error("Error editing message:", err);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      const currentReactions = message.reactions || {};
      const userReactions = currentReactions[emoji] || [];
      const hasReacted = userReactions.includes(user.id);

      const updatedReactions = {
        ...currentReactions,
        [emoji]: hasReacted
          ? userReactions.filter((id) => id !== user.id)
          : [...userReactions, user.id],
      };

      // Remove empty reaction arrays
      if (updatedReactions[emoji].length === 0) {
        delete updatedReactions[emoji];
      }

      const { error } = await supabase
        .from("group_messages")
        .update({ reactions: updatedReactions })
        .eq("id", messageId);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, reactions: updatedReactions } : msg
        )
      );
    } catch (err) {
      console.error("Error updating reaction:", err);
    } finally {
      setShowReactionMenu(false);
    }
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageViewer(true);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.user_id === currentUserId;

    const handleLongPress = (event: GestureResponderEvent) => {
      if (isCurrentUser) {
        setSelectedMessage(item);
        setMenuPosition({
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
        });
        setShowMessageMenu(true);
      }
    };

    const handlePress = (event: GestureResponderEvent) => {
      setSelectedMessage(item);
      setMenuPosition({
        x: event.nativeEvent.pageX,
        y: event.nativeEvent.pageY,
      });
      setShowReactionMenu(true);
    };

    const handleImageClick = () => {
      if (item.attachment?.url) {
        handleImagePress(item.attachment.url);
      }
    };

    return (
      <Pressable onLongPress={handleLongPress} onPress={handlePress}>
        <View
          style={[
            styles.messageContainer,
            isCurrentUser ? styles.currentUser : styles.otherUser,
          ]}
        >
          {!isCurrentUser && (
            <Avatar.Text
              size={32}
              label={item.user_email.substring(0, 2).toUpperCase()}
              style={styles.avatar}
            />
          )}
          <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: isCurrentUser
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            {!isCurrentUser && (
              <Text style={styles.sender}>{item.user_email}</Text>
            )}
            {item.attachment?.type === "image" && item.attachment.url && (
              <Pressable onPress={handleImageClick}>
                <ExpoImage
                  source={{ uri: item.attachment.url }}
                  style={styles.attachedImage}
                  contentFit="cover"
                  transition={300}
                />
              </Pressable>
            )}
            {item.attachment?.type === "file" && (
              <Pressable
                style={styles.fileAttachment}
                onPress={() => Linking.openURL(item.attachment!.url)}
              >
                <IconButton icon="file-document-outline" size={24} />
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {item.attachment.name}
                  </Text>
                  <Text style={styles.fileType}>
                    {item.attachment.name?.split(".").pop()?.toUpperCase()}
                  </Text>
                </View>
              </Pressable>
            )}
            {item.content && (
              <Text
                style={[
                  styles.messageText,
                  { color: isCurrentUser ? "white" : theme.colors.onSurface },
                ]}
              >
                {item.content}
              </Text>
            )}
            <Text
              style={[
                styles.timestamp,
                {
                  color: isCurrentUser
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(0,0,0,0.6)",
                },
              ]}
            >
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {Object.entries(item.reactions || {}).length > 0 && (
              <View style={styles.reactionsContainer}>
                {Object.entries(item.reactions).map(([emoji, users]) => (
                  <Pressable
                    key={emoji}
                    onPress={() => handleReaction(item.id, emoji)}
                    style={[
                      styles.reactionBubble,
                      users.includes(currentUserId || "")
                        ? styles.reactionSelected
                        : null,
                    ]}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                    <Text style={styles.reactionCount}>{users.length}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />

        {typingUsers.length > 0 && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>
              {typingUsers.length === 1
                ? `${typingUsers[0].email} is typing...`
                : `${typingUsers.length} people are typing...`}
            </Text>
          </View>
        )}

        {uploadProgress > 0 && (
          <View style={styles.progressContainer}>
            <ProgressBar progress={uploadProgress} style={styles.progressBar} />
            <Text style={styles.progressText}>
              {Math.round(uploadProgress * 100)}%
            </Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <IconButton
            icon="attachment"
            size={24}
            onPress={handleAttachment}
            disabled={uploading}
            loading={uploading}
          />
          <TextInput
            mode="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={handleTextChange}
            style={styles.input}
            right={
              <TextInput.Icon
                icon="send"
                disabled={(!newMessage.trim() && !uploading) || sending}
                onPress={() => handleSend()}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>

      <Portal>
        <Menu
          visible={showMessageMenu}
          onDismiss={() => setShowMessageMenu(false)}
          anchor={menuPosition}
        >
          <Menu.Item
            onPress={() => {
              setEditedContent(selectedMessage?.content || "");
              setShowEditDialog(true);
            }}
            title="Edit"
            leadingIcon="pencil"
          />
          <Menu.Item
            onPress={handleDeleteMessage}
            title="Delete"
            leadingIcon="delete"
          />
        </Menu>

        <Dialog
          visible={showEditDialog}
          onDismiss={() => setShowEditDialog(false)}
        >
          <Dialog.Title>Edit Message</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              value={editedContent}
              onChangeText={setEditedContent}
              multiline
              style={styles.editInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onPress={handleEditMessage}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Menu
          visible={showReactionMenu}
          onDismiss={() => setShowReactionMenu(false)}
          anchor={menuPosition}
        >
          <View style={styles.reactionMenu}>
            {QUICK_REACTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => {
                  if (selectedMessage) {
                    handleReaction(selectedMessage.id, emoji);
                  }
                }}
                style={styles.reactionMenuItem}
              >
                <Text style={styles.reactionMenuEmoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </Menu>
      </Portal>

      <ImageView
        images={[{ uri: selectedImage || "" }]}
        imageIndex={0}
        visible={showImageViewer}
        onRequestClose={() => setShowImageViewer(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "80%",
  },
  currentUser: {
    alignSelf: "flex-end",
  },
  otherUser: {
    alignSelf: "flex-start",
  },
  avatar: {
    marginRight: 8,
    alignSelf: "flex-end",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  sender: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  input: {
    flex: 1,
  },
  typingContainer: {
    padding: 8,
    paddingHorizontal: 16,
  },
  typingText: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: "italic",
  },
  editInput: {
    marginTop: 8,
  },
  reactionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 4,
  },
  reactionBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reactionSelected: {
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 12,
    opacity: 0.7,
  },
  reactionMenu: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    gap: 8,
  },
  reactionMenuItem: {
    padding: 8,
  },
  reactionMenuEmoji: {
    fontSize: 24,
  },
  attachedImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    backgroundColor: "black",
  },
  fileAttachment: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
  },
  fileType: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  progressContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    opacity: 0.7,
  },
});
