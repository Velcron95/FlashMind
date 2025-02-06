import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { SegmentedButtons } from "react-native-paper";
import { useCategories } from "../hooks/useCategories";

type CategoryPickerProps = {
  value: string | null;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
};

export default function CategoryPicker({
  value,
  onChange,
  style,
}: CategoryPickerProps) {
  const { categories, loading, error } = useCategories();

  if (loading || error || !categories?.length) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <SegmentedButtons
        value={value || ""}
        onValueChange={onChange}
        buttons={categories.map((category) => ({
          value: category.id,
          label: category.name,
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
});
