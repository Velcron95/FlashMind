import React from "react";
import { Portal, Dialog, Button } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform, View, StyleSheet } from "react-native";

interface TimePickerProps {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onDismiss: () => void;
}

export default function TimePicker({
  visible,
  value,
  onChange,
  onDismiss,
}: TimePickerProps) {
  const handleChange = (_: any, selectedDate?: Date) => {
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Set Reminder Time</Dialog.Title>
        <Dialog.Content>
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={value}
              mode="time"
              is24Hour={true}
              onChange={handleChange}
              style={styles.picker}
              display={Platform.OS === "ios" ? "spinner" : "default"}
            />
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={onDismiss}>OK</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  picker: {
    width: 200,
  },
});
