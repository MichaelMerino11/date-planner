import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "../src/store/authStore";
import api from "../src/services/api";

const COLORS = [
  "Verde",
  "Rojo",
  "Azul",
  "Amarillo",
  "Morado",
  "Rosado",
  "Naranja",
  "Negro",
];

const COLOR_MAP: Record<string, string> = {
  Verde: "#4CAF50",
  Rojo: "#F44336",
  Azul: "#2196F3",
  Amarillo: "#FFC107",
  Morado: "#9C27B0",
  Rosado: "#E91E8C",
  Naranja: "#FF9800",
  Negro: "#212121",
};

type AlertType = "success" | "error";

interface CustomAlertData {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
}

export default function EditProfileScreen() {
  const { user, token, coupleId, setAuth } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [birthdate, setBirthdate] = useState("");
  const [favoriteColor, setFavoriteColor] = useState("");
  const [favoriteSong, setFavoriteSong] = useState("");
  const [favoriteFood, setFavoriteFood] = useState("");
  const [favoriteMovie, setFavoriteMovie] = useState("");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showEmailPass, setShowEmailPass] = useState(false);

  const [alert, setAlert] = useState<CustomAlertData>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  const showAlert = (type: AlertType, title: string, message: string) => {
    setAlert({ visible: true, type, title, message });
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showAlert("error", "Error", "El nombre no puede estar vacío");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {};
      if (name !== user?.name) payload.name = name;
      if (birthdate) payload.birthdate = birthdate;
      if (favoriteColor) payload.favorite_color = favoriteColor;
      if (favoriteSong) payload.favorite_song = favoriteSong;
      if (favoriteFood) payload.favorite_food = favoriteFood;
      if (favoriteMovie) payload.favorite_movie = favoriteMovie;

      await api.patch("/api/auth/update-profile", payload);

      if (token && user && coupleId) {
        await setAuth(token, { ...user, name }, coupleId);
      }
      showAlert(
        "success",
        "Perfil actualizado",
        "Tus datos fueron guardados correctamente",
      );
    } catch {
      showAlert("error", "Error", "No se pudo actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert("error", "Error", "Completa todos los campos");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("error", "Error", "Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      showAlert(
        "error",
        "Error",
        "La nueva contraseña debe tener al menos 6 caracteres",
      );
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showAlert(
        "success",
        "Contraseña actualizada",
        "Tu contraseña fue cambiada exitosamente",
      );
    } catch (error: any) {
      showAlert(
        "error",
        "Error",
        error.response?.data?.message || "No se pudo cambiar la contraseña",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      showAlert("error", "Error", "Completa todos los campos");
      return;
    }
    setSavingEmail(true);
    try {
      await api.patch("/api/auth/change-email", {
        newEmail,
        password: emailPassword,
      });
      if (token && user && coupleId) {
        await setAuth(token, { ...user, email: newEmail }, coupleId);
      }
      setNewEmail("");
      setEmailPassword("");
      showAlert(
        "success",
        "Email actualizado",
        "Tu correo fue cambiado exitosamente",
      );
    } catch (error: any) {
      showAlert(
        "error",
        "Error",
        error.response?.data?.message || "No se pudo cambiar el email",
      );
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#C2185B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info personal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información personal</Text>

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor="#C9A0B0"
          />

          <Text style={styles.label}>Fecha de nacimiento</Text>
          <TextInput
            style={styles.input}
            value={birthdate}
            onChangeText={setBirthdate}
            placeholder="YYYY-MM-DD (ej: 2002-02-08)"
            placeholderTextColor="#C9A0B0"
          />

          <Text style={styles.label}>Color favorito</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorChip,
                  { borderColor: COLOR_MAP[color] },
                  favoriteColor === color && {
                    backgroundColor: COLOR_MAP[color],
                  },
                ]}
                onPress={() =>
                  setFavoriteColor(favoriteColor === color ? "" : color)
                }
              >
                <Text
                  style={[
                    styles.colorChipText,
                    favoriteColor === color && styles.colorChipTextActive,
                  ]}
                >
                  {color}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Canción favorita</Text>
          <TextInput
            style={styles.input}
            value={favoriteSong}
            onChangeText={setFavoriteSong}
            placeholder="Artista - Canción"
            placeholderTextColor="#C9A0B0"
          />

          <Text style={styles.label}>Comida favorita</Text>
          <TextInput
            style={styles.input}
            value={favoriteFood}
            onChangeText={setFavoriteFood}
            placeholder="Tu comida favorita"
            placeholderTextColor="#C9A0B0"
          />

          <Text style={styles.label}>Película favorita</Text>
          <TextInput
            style={styles.input}
            value={favoriteMovie}
            onChangeText={setFavoriteMovie}
            placeholder="Tu película favorita"
            placeholderTextColor="#C9A0B0"
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="save" size={18} color="#fff" />
                <Text style={styles.saveBtnText}> Guardar cambios</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Cambiar email */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cambiar correo</Text>

          <Text style={styles.label}>Nuevo correo</Text>
          <TextInput
            style={styles.input}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="nuevo@correo.com"
            placeholderTextColor="#C9A0B0"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Contraseña actual</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={emailPassword}
              onChangeText={setEmailPassword}
              placeholder="Tu contraseña"
              placeholderTextColor="#C9A0B0"
              secureTextEntry={!showEmailPass}
            />
            <TouchableOpacity
              onPress={() => setShowEmailPass(!showEmailPass)}
              style={styles.eyeBtn}
            >
              <MaterialIcons
                name={showEmailPass ? "visibility-off" : "visibility"}
                size={20}
                color="#AD7090"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, savingEmail && styles.saveBtnDisabled]}
            onPress={handleChangeEmail}
            disabled={savingEmail}
          >
            {savingEmail ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="email" size={18} color="#fff" />
                <Text style={styles.saveBtnText}> Cambiar correo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Cambiar contraseña */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cambiar contraseña</Text>

          <Text style={styles.label}>Contraseña actual</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor="#C9A0B0"
              secureTextEntry={!showCurrentPass}
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPass(!showCurrentPass)}
              style={styles.eyeBtn}
            >
              <MaterialIcons
                name={showCurrentPass ? "visibility-off" : "visibility"}
                size={20}
                color="#AD7090"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nueva contraseña</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor="#C9A0B0"
              secureTextEntry={!showNewPass}
            />
            <TouchableOpacity
              onPress={() => setShowNewPass(!showNewPass)}
              style={styles.eyeBtn}
            >
              <MaterialIcons
                name={showNewPass ? "visibility-off" : "visibility"}
                size={20}
                color="#AD7090"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar contraseña</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#C9A0B0"
              secureTextEntry={!showConfirmPass}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPass(!showConfirmPass)}
              style={styles.eyeBtn}
            >
              <MaterialIcons
                name={showConfirmPass ? "visibility-off" : "visibility"}
                size={20}
                color="#AD7090"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, savingPassword && styles.saveBtnDisabled]}
            onPress={handleChangePassword}
            disabled={savingPassword}
          >
            {savingPassword ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="lock" size={18} color="#fff" />
                <Text style={styles.saveBtnText}> Cambiar contraseña</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Alert */}
      <Modal visible={alert.visible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <MaterialIcons
              name={alert.type === "success" ? "check-circle" : "error"}
              size={48}
              color={alert.type === "success" ? "#0F6E56" : "#E91E8C"}
            />
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertMessage}>{alert.message}</Text>
            <TouchableOpacity
              style={[
                styles.alertBtn,
                alert.type === "error" && styles.alertBtnError,
              ]}
              onPress={() => setAlert((prev) => ({ ...prev, visible: false }))}
            >
              <Text style={styles.alertBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF0F3" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontFamily: "Nunito_700Bold", fontSize: 22, color: "#C2185B" },
  content: { padding: 20, paddingBottom: 60 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 17,
    color: "#3D1A2E",
    marginBottom: 16,
  },
  label: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    color: "#7D3C5E",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFF0F3",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: "#3D1A2E",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F8C8D8",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  colorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: "#FFF0F3",
  },
  colorChipText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#7D3C5E",
  },
  colorChipTextActive: { color: "#fff" },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F3",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F8C8D8",
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: "#3D1A2E",
  },
  eyeBtn: { padding: 14 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E91E8C",
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: "Nunito_700Bold", fontSize: 16, color: "#fff" },
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(61,26,46,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  alertBox: {
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
  alertTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 20,
    color: "#3D1A2E",
    marginTop: 16,
    marginBottom: 8,
  },
  alertMessage: {
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: "#AD7090",
    textAlign: "center",
    marginBottom: 24,
  },
  alertBtn: {
    backgroundColor: "#E91E8C",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  alertBtnError: { backgroundColor: "#C2185B" },
  alertBtnText: { fontFamily: "Nunito_700Bold", fontSize: 15, color: "#fff" },
});
