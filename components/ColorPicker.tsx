import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  style?: any;
  colors?: string[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onSelectColor,
  style,
  colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEEAD",
    "#D4A5A5",
    "#9B59B6",
    "#3498DB",
    "#E67E22",
    "#2ECC71",
  ],
}) => {
  return (
    <View style={[styles.container, style]}>
      {colors.map((color) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorButton,
            { backgroundColor: color },
            selectedColor === color && styles.selected,
          ]}
          onPress={() => onSelectColor(color)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4,
  },
  selected: {
    borderWidth: 3,
    borderColor: "white",
  },
});

export default ColorPicker;
