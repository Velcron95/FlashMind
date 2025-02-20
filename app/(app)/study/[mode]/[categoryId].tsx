import React from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { StudySession } from "@/features/study/components/StudySession";

export default function StudyModeScreen() {
  const { mode, categoryId } = useLocalSearchParams<{
    mode: string;
    categoryId: string;
  }>();

  return (
    <View style={{ flex: 1 }}>
      <StudySession mode={mode} categoryId={categoryId} />
    </View>
  );
}
