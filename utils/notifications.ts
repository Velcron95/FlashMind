import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationsPermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export async function scheduleStudyReminder(hour: number, minute: number) {
  // Cancel existing reminders first
  await cancelStudyReminders();

  // Create a date for today at the specified time
  const now = new Date();
  now.setHours(hour, minute, 0, 0);

  // Schedule new daily reminder
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to Study! 📚",
      body: "Keep your streak going by reviewing your flashcards now.",
      sound: true,
    },
    trigger: {
      channelId: "study-reminders",
      date: now,
      repeats: true,
    },
  });
}

export async function cancelStudyReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

export async function registerForPushNotificationsAsync() {
  try {
    // ... implementation
  } catch (error) {
    console.error("Error registering for notifications:", error);
    throw error;
  }
}
