import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Share,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";
import api from "../../src/services/api";

export default function ProfileScreen() {
  const { user, logout, inviteCode, setAuth, token, coupleId } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [loadingPartner, setLoadingPartner] = useState(true);

  useEffect(() => {
    fetchPartner();
  }, []);

  const fetchPartner = async () => {
    try {
      const res = await api.get("/api/auth/me");
      setPartnerName(res.data.partnerName);
    } catch {
      setPartnerName(null);
    } finally {
      setLoadingPartner(false);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío");
      return;
    }
    setSaving(true);
    try {
      const res = await api.patch("/api/auth/update-name", { name });
      if (user && token && coupleId) {
        await setAuth(
          token,
          { ...user, name: res.data.name },
          coupleId,
          inviteCode || undefined,
        );
      }
      setEditing(false);
    } catch {
      Alert.alert("Error", "No se pudo actualizar el nombre");
    } finally {
      setSaving(false);
    }
  };

  const handleShareCode = async () => {
    if (!inviteCode) return;
    await Share.share({
      message: `¡Úsate Date Planner conmigo! 💕\nMi código de invitación es: ${inviteCode}\n\nDescarga Expo Go y escanea el QR para unirte.`,
    });
  };

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil 👤</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                autoFocus
                placeholder="Tu nombre"
                placeholderTextColor="#C9A0B0"
              />
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveName}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setEditing(false);
                  setName(user?.name || "");
                }}
              >
                <Text style={styles.cancelBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.name}</Text>
              <TouchableOpacity
                onPress={() => setEditing(true)}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>✏️</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Pareja */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu pareja 💕</Text>
          {loadingPartner ? (
            <ActivityIndicator color="#E91E8C" />
          ) : partnerName ? (
            <Text style={styles.partnerName}>{partnerName}</Text>
          ) : (
            <Text style={styles.noPartner}>Aún no vinculados</Text>
          )}
        </View>

        {/* Código de invitación */}
        {inviteCode && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Código de invitación</Text>
            <Text style={styles.cardDesc}>
              Comparte este código para que tu pareja se una
            </Text>
            <TouchableOpacity style={styles.codeBox} onPress={handleShareCode}>
              <Text style={styles.codeText}>{inviteCode}</Text>
              <Text style={styles.codeShare}>Toca para compartir 📤</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF0F3" },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
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
  headerTitle: { fontFamily: "Nunito_700Bold", fontSize: 28, color: "#C2185B" },
  content: { padding: 20, paddingBottom: 100 },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E91E8C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#E91E8C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { fontFamily: "Nunito_700Bold", fontSize: 36, color: "#fff" },
  nameRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  userName: {
    fontFamily: "Nunito_700Bold",
    fontSize: 24,
    color: "#3D1A2E",
    marginRight: 8,
  },
  editBtn: { padding: 4 },
  editBtnText: { fontSize: 18 },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: "Nunito_400Regular",
    fontSize: 16,
    color: "#3D1A2E",
    borderWidth: 1,
    borderColor: "#F8C8D8",
  },
  saveBtn: {
    backgroundColor: "#E91E8C",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveBtnText: { fontFamily: "Nunito_700Bold", fontSize: 13, color: "#fff" },
  cancelBtn: {
    backgroundColor: "#FFF0F3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#F8C8D8",
  },
  cancelBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: "#AD7090",
  },
  userEmail: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#AD7090",
  },
  card: {
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
  cardTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: "#3D1A2E",
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "#AD7090",
    marginBottom: 12,
  },
  partnerName: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 18,
    color: "#E91E8C",
  },
  noPartner: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#C9A0B0",
  },
  codeBox: {
    backgroundColor: "#FFF0F3",
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F8C8D8",
    borderStyle: "dashed",
  },
  codeText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 28,
    color: "#E91E8C",
    letterSpacing: 6,
    marginBottom: 6,
  },
  codeShare: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: "#AD7090",
  },
  logoutBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F8C8D8",
    marginTop: 8,
  },
  logoutBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: "#AD7090",
  },
});
