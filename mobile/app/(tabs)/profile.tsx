import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Share,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { router } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";
import api from "../../src/services/api";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  birthdate: string;
  favoriteColor: string;
  favoriteSong: string;
  favoriteFood: string;
  favoriteMovie: string;
  profilePhoto: string;
  inviteCode: string;
  partner: {
    name: string;
    birthdate: string;
    favoriteColor: string;
    favoriteSong: string;
    favoriteFood: string;
    favoriteMovie: string;
    profilePhoto: string;
  } | null;
}

function getDaysUntilBirthday(birthdate: string): number {
  if (!birthdate) return -1;
  const today = new Date();
  const birth = new Date(birthdate);
  const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getAge(birthdate: string): number {
  if (!birthdate) return 0;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatBirthdate(birthdate: string): string {
  if (!birthdate) return "";
  const d = new Date(birthdate);
  return d.toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ProfileScreen() {
  const { user, logout, inviteCode, setAuth, token, coupleId } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/auth/me");
      setProfile(res.data);
      if (res.data.inviteCode && token && user && coupleId) {
        await setAuth(token, user, coupleId, res.data.inviteCode);
      }
    } catch {
      Alert.alert("Error", "No se pudo cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploadingPhoto(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      if (!manipulated.base64) throw new Error("No base64");
      const base64 = `data:image/jpeg;base64,${manipulated.base64}`;
      const uploadRes = await api.post("/api/photos", { base64 });
      const photoUrl = uploadRes.data.cloudinary_url;
      await api.patch("/api/auth/update-profile", { profile_photo: photoUrl });
      setProfile((prev) => (prev ? { ...prev, profilePhoto: photoUrl } : prev));
    } catch {
      Alert.alert("Error", "No se pudo subir la foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleShareCode = async () => {
    if (!inviteCode && !profile?.inviteCode) return;
    await Share.share({
      message: `¡Úsate Date Planner conmigo! 💕\nMi código de invitación es: ${inviteCode || profile?.inviteCode}\n\nDescarga la app para unirte.`,
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E91E8C" />
      </View>
    );
  }

  const myDaysUntilBirthday = profile?.birthdate
    ? getDaysUntilBirthday(profile.birthdate)
    : -1;
  const partnerDaysUntilBirthday = profile?.partner?.birthdate
    ? getDaysUntilBirthday(profile.partner.birthdate)
    : -1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handleUploadPhoto}
            disabled={uploadingPhoto}
          >
            {profile?.profilePhoto ? (
              <Image
                source={{ uri: profile.profilePhoto }}
                style={styles.avatarImg}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="camera-alt" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{profile?.name}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
          {myDaysUntilBirthday === 0 && (
            <View style={styles.birthdayBanner}>
              <MaterialIcons name="cake" size={16} color="#fff" />
              <Text style={styles.birthdayBannerText}>
                {" "}
                ¡Hoy es tu cumpleaños!
              </Text>
            </View>
          )}
          {myDaysUntilBirthday > 0 && (
            <View style={styles.birthdayRow}>
              <MaterialIcons name="cake" size={14} color="#AD7090" />
              <Text style={styles.birthdayCountdown}>
                {" "}
                Tu cumpleaños en {myDaysUntilBirthday} días
              </Text>
            </View>
          )}
        </View>

        {/* Sobre mí */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sobre mí</Text>
          <DataRow
            icon="cake"
            label="Cumpleaños"
            value={
              profile?.birthdate
                ? `${formatBirthdate(profile.birthdate)} · ${getAge(profile.birthdate)} años`
                : "No definido"
            }
          />
          {profile?.favoriteColor && (
            <DataRow
              icon="palette"
              label="Color favorito"
              value={profile.favoriteColor}
            />
          )}
          {profile?.favoriteSong && (
            <DataRow
              icon="music-note"
              label="Canción favorita"
              value={profile.favoriteSong}
            />
          )}
          {profile?.favoriteFood && (
            <DataRow
              icon="restaurant"
              label="Comida favorita"
              value={profile.favoriteFood}
            />
          )}
          {profile?.favoriteMovie && (
            <DataRow
              icon="movie"
              label="Película favorita"
              value={profile.favoriteMovie}
            />
          )}
        </View>

        {/* Pareja */}
        {profile?.partner ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mi pareja</Text>
            <View style={styles.partnerHeader}>
              {profile.partner.profilePhoto ? (
                <Image
                  source={{ uri: profile.partner.profilePhoto }}
                  style={styles.partnerAvatar}
                />
              ) : (
                <View style={styles.partnerAvatarPlaceholder}>
                  <Text style={styles.partnerAvatarText}>
                    {profile.partner.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.partnerName}>{profile.partner.name}</Text>
                {partnerDaysUntilBirthday === 0 && (
                  <View style={styles.birthdayRow}>
                    <MaterialIcons name="cake" size={14} color="#E91E8C" />
                    <Text
                      style={[styles.birthdayCountdown, { color: "#E91E8C" }]}
                    >
                      {" "}
                      ¡Hoy es su cumpleaños!
                    </Text>
                  </View>
                )}
                {partnerDaysUntilBirthday > 0 && (
                  <View style={styles.birthdayRow}>
                    <MaterialIcons name="cake" size={14} color="#AD7090" />
                    <Text style={styles.birthdayCountdown}>
                      {" "}
                      Su cumpleaños en {partnerDaysUntilBirthday} días
                    </Text>
                  </View>
                )}
              </View>
            </View>
            {profile.partner.birthdate && (
              <DataRow
                icon="cake"
                label="Cumpleaños"
                value={`${formatBirthdate(profile.partner.birthdate)} · ${getAge(profile.partner.birthdate)} años`}
              />
            )}
            {profile.partner.favoriteColor && (
              <DataRow
                icon="palette"
                label="Color favorito"
                value={profile.partner.favoriteColor}
              />
            )}
            {profile.partner.favoriteSong && (
              <DataRow
                icon="music-note"
                label="Canción favorita"
                value={profile.partner.favoriteSong}
              />
            )}
            {profile.partner.favoriteFood && (
              <DataRow
                icon="restaurant"
                label="Comida favorita"
                value={profile.partner.favoriteFood}
              />
            )}
            {profile.partner.favoriteMovie && (
              <DataRow
                icon="movie"
                label="Película favorita"
                value={profile.partner.favoriteMovie}
              />
            )}
            {!profile.partner.favoriteColor &&
              !profile.partner.favoriteSong && (
                <Text style={styles.partnerEmpty}>
                  Ella aún no ha completado su perfil
                </Text>
              )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tu pareja</Text>
            <Text style={styles.noPartner}>Aún no vinculados</Text>
          </View>
        )}

        {/* Código */}
        {(inviteCode || profile?.inviteCode) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Código de invitación</Text>
            <Text style={styles.cardDesc}>
              Comparte este código para que tu pareja se una
            </Text>
            <TouchableOpacity style={styles.codeBox} onPress={handleShareCode}>
              <Text style={styles.codeText}>
                {inviteCode || profile?.inviteCode}
              </Text>
              <View style={styles.shareRow}>
                <MaterialIcons name="share" size={14} color="#AD7090" />
                <Text style={styles.codeShare}> Toca para compartir</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={18} color="#AD7090" />
          <Text style={styles.logoutBtnText}> Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DataRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.dataRow}>
      <MaterialIcons
        name={icon as any}
        size={22}
        color="#E91E8C"
        style={styles.dataIcon}
      />
      <View style={styles.dataTexts}>
        <Text style={styles.dataLabel}>{label}</Text>
        <Text style={styles.dataValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF0F3" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF0F3",
  },
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
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrapper: { position: "relative", marginBottom: 16 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E91E8C",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E91E8C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarText: { fontFamily: "Nunito_700Bold", fontSize: 40, color: "#fff" },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E91E8C",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileName: {
    fontFamily: "Nunito_700Bold",
    fontSize: 24,
    color: "#3D1A2E",
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#AD7090",
    marginBottom: 8,
  },
  birthdayBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E91E8C",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  birthdayBannerText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: "#fff",
  },
  birthdayRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  birthdayCountdown: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
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
    fontSize: 17,
    color: "#3D1A2E",
    marginBottom: 16,
  },
  cardDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "#AD7090",
    marginBottom: 12,
  },
  dataRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  dataIcon: { marginRight: 12, marginTop: 2 },
  dataTexts: { flex: 1 },
  dataLabel: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: "#AD7090",
    marginBottom: 2,
  },
  dataValue: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    color: "#3D1A2E",
  },
  partnerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  partnerAvatar: { width: 56, height: 56, borderRadius: 28 },
  partnerAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F8C8D8",
    justifyContent: "center",
    alignItems: "center",
  },
  partnerAvatarText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 22,
    color: "#E91E8C",
  },
  partnerName: { fontFamily: "Nunito_700Bold", fontSize: 18, color: "#C2185B" },
  partnerEmpty: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#C9A0B0",
    textAlign: "center",
    paddingVertical: 8,
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
  shareRow: { flexDirection: "row", alignItems: "center" },
  codeShare: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: "#AD7090",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
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
