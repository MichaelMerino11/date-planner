import { useState } from "react";

type AlertType = "success" | "error" | "warning" | "confirm";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "destructive" | "cancel";
}

interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

export function useCustomAlert() {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    type: "success",
    title: "",
  });

  const showAlert = (
    type: AlertType,
    title: string,
    message?: string,
    buttons?: AlertButton[],
  ) => {
    setAlertState({ visible: true, type, title, message, buttons });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  return { alertState, showAlert, hideAlert };
}
