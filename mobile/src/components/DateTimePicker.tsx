import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import RNDateTimePicker from "@react-native-community/datetimepicker";

interface Props {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

export default function DateTimePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha y hora",
}: Props) {
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());

  const formatDisplay = (date: Date) => {
    return date.toLocaleDateString("es-EC", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDateChange = (_: any, selected?: Date) => {
    if (Platform.OS === "android") setShowDate(false);
    if (selected) {
      setTempDate(selected);
      if (Platform.OS === "android") setShowTime(true);
    }
  };

  const handleTimeChange = (_: any, selected?: Date) => {
    if (Platform.OS === "android") setShowTime(false);
    if (selected) {
      onChange(selected);
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.button, value && styles.buttonActive]}
        onPress={() => setShowDate(true)}
      >
        <Text style={styles.buttonIcon}>📅</Text>
        <Text style={[styles.buttonText, value && styles.buttonTextActive]}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
        {value && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {showDate && (
        <RNDateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          minimumDate={new Date()}
          locale="es-EC"
        />
      )}

      {showTime && (
        <RNDateTimePicker
          value={tempDate}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleTimeChange}
          locale="es-EC"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F3",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#F8C8D8",
    marginBottom: 16,
  },
  buttonActive: { borderColor: "#E91E8C", backgroundColor: "#FFF0F3" },
  buttonIcon: { fontSize: 18, marginRight: 10 },
  buttonText: {
    flex: 1,
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: "#C9A0B0",
  },
  buttonTextActive: { color: "#3D1A2E" },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F8C8D8",
    justifyContent: "center",
    alignItems: "center",
  },
  clearText: { fontSize: 11, color: "#AD7090", fontFamily: "Nunito_700Bold" },
});
