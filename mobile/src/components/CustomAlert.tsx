import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type AlertType = "success" | "error" | "warning" | "confirm";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "destructive" | "cancel";
}

interface CustomAlertProps {
  visible: boolean;
  type: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
}

const ICON_MAP: Record<AlertType, string> = {
  success: "check-circle",
  error: "error",
  warning: "warning",
  confirm: "help",
};

const COLOR_MAP: Record<AlertType, string> = {
  success: "#0F6E56",
  error: "#C2185B",
  warning: "#BA7517",
  confirm: "#E91E8C",
};

export default function CustomAlert({
  visible,
  type,
  title,
  message,
  buttons,
  onClose,
}: CustomAlertProps) {
  const defaultButtons: AlertButton[] = buttons || [
    { text: "Entendido", onPress: onClose },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <MaterialIcons
            name={ICON_MAP[type] as any}
            size={52}
            color={COLOR_MAP[type]}
          />
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.buttons}>
            {defaultButtons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.btn,
                  btn.style === "destructive" && styles.btnDestructive,
                  btn.style === "cancel" && styles.btnCancel,
                  defaultButtons.length === 1 && styles.btnFull,
                ]}
                onPress={() => {
                  onClose();
                  btn.onPress?.();
                }}
              >
                <Text
                  style={[
                    styles.btnText,
                    btn.style === "destructive" && styles.btnTextDestructive,
                    btn.style === "cancel" && styles.btnTextCancel,
                  ]}
                >
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(61,26,46,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    alignItems: "center",
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontFamily: "Nunito_700Bold",
    fontSize: 20,
    color: "#3D1A2E",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: "#AD7090",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  buttons: { flexDirection: "row", gap: 10, width: "100%" },
  btn: {
    flex: 1,
    backgroundColor: "#E91E8C",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnFull: { flex: 1 },
  btnDestructive: { backgroundColor: "#C2185B" },
  btnCancel: {
    backgroundColor: "#FFF0F3",
    borderWidth: 1,
    borderColor: "#F8C8D8",
  },
  btnText: { fontFamily: "Nunito_700Bold", fontSize: 15, color: "#fff" },
  btnTextDestructive: { color: "#fff" },
  btnTextCancel: { color: "#AD7090" },
});
