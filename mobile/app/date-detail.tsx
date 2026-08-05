import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { photosService, datesService } from "../src/services/api";
import { useAuthStore } from "../src/store/authStore";
import CustomAlert from "../src/components/CustomAlert";
import { useCustomAlert } from "../src/hooks/useCustomAlert";

const { width } = Dimensions.get("window");

interface Photo {
  id: string;
  cloudinary_url: string;
  uploaded_by_name: string;
  uploaded_by: string;
  created_at: string;
}

const STATUS_LABELS: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pendiente", color: "#AD7090", bg: "#FFF0F3" },
  confirmed: { label: "Confirmada", color: "#0F6E56", bg: "#E1F5EE" },
  done: { label: "Completada", color: "#3B6D11", bg: "#EAF3DE" },
  cancelled: { label: "Cancelada", color: "#993C1D", bg: "#FAECE7" },
};

const CATEGORY_ICONS: Record<string, string> = {
  restaurante: "restaurant",
  cafe: "local-cafe",
  parque: "park",
  cine: "local-movies",
  playa: "beach-access",
  museo: "museum",
  otro: "place",
};

function formatDate(iso: string) {
  if (!iso) return "Sin fecha definida";
  const d = new Date(iso);
  return d.toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DateDetailScreen() {
  const {
    id,
    title,
    status,
    place_name,
    place_address,
    place_category,
    scheduled_at,
    notes,
    is_random,
  } = useLocalSearchParams<{
    id: string;
    title: string;
    status: string;
    place_name: string;
    place_address: string;
    place_category: string;
    scheduled_at: string;
    notes: string;
    is_random: string;
  }>();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { user } = useAuthStore();
  const { alertState, showAlert, hideAlert } = useCustomAlert();

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const res = await photosService.getByDate(id);
      setPhotos(res.data);
    } catch {
      console.error("Error cargando fotos");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async () => {
    const { status: permStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== "granted") {
      showAlert(
        "error",
        "Permiso requerido",
        "Necesitamos acceso a tu galería",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) return;

    setUploading(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      if (!manipulated.base64) throw new Error("No base64");
      const base64 = `data:image/jpeg;base64,${manipulated.base64}`;
      const res = await photosService.upload(base64, id);
      setPhotos((prev) => [res.data, ...prev]);
      showAlert(
        "success",
        "Foto agregada",
        "La foto fue guardada en esta salida",
      );
    } catch {
      showAlert("error", "Error", "No se pudo subir la foto");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (url: string) => {
    const { status: permStatus } = await MediaLibrary.requestPermissionsAsync();
    if (permStatus !== "granted") {
      showAlert(
        "error",
        "Permiso requerido",
        "Necesitamos permiso para guardar en tu galería",
      );
      return;
    }
    try {
      const filename = `dateplanner_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(
        url,
        FileSystem.documentDirectory + filename,
      );
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      await MediaLibrary.createAlbumAsync("Date Planner", asset, false);
      showAlert(
        "success",
        "Foto guardada",
        "Guardada en tu galería en el álbum Date Planner",
      );
    } catch {
      showAlert("error", "Error", "No se pudo guardar la foto");
    }
  };

  const handleDeletePhoto = (photo: Photo) => {
    if (photo.uploaded_by !== user?.id) {
      showAlert(
        "error",
        "Sin permiso",
        "Solo puedes eliminar tus propias fotos",
      );
      return;
    }
    showAlert("confirm", "Eliminar foto", "¿Eliminar esta foto de la salida?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await photosService.delete(photo.id);
            setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
            setSelectedPhoto(null);
          } catch {
            showAlert("error", "Error", "No se pudo eliminar la foto");
          }
        },
      },
    ]);
  };

  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.pending;
  const IMG_SIZE = (width - 48) / 3;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#C2185B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detalle de salida
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info de la salida */}
        <View style={styles.infoCard}>
          <View style={styles.infoTop}>
            <View style={styles.infoIconWrapper}>
              <MaterialIcons
                name={(CATEGORY_ICONS[place_category] || "event") as any}
                size={32}
                color="#E91E8C"
              />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoTitle}>{title}</Text>
              <View
                style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}
              >
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>
            {is_random === "true" && (
              <MaterialIcons name="casino" size={20} color="#AD7090" />
            )}
          </View>

          {place_name && (
            <View style={styles.infoRow}>
              <MaterialIcons name="place" size={18} color="#E91E8C" />
              <View style={styles.infoRowTexts}>
                <Text style={styles.infoRowLabel}>Lugar</Text>
                <Text style={styles.infoRowValue}>{place_name}</Text>
                {place_address && (
                  <Text style={styles.infoRowSub}>{place_address}</Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={18} color="#E91E8C" />
            <View style={styles.infoRowTexts}>
              <Text style={styles.infoRowLabel}>Fecha y hora</Text>
              <Text style={styles.infoRowValue}>
                {formatDate(scheduled_at)}
              </Text>
            </View>
          </View>

          {notes && (
            <View style={styles.infoRow}>
              <MaterialIcons name="notes" size={18} color="#E91E8C" />
              <View style={styles.infoRowTexts}>
                <Text style={styles.infoRowLabel}>Notas</Text>
                <Text style={styles.infoRowValue}>{notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Fotos de la salida */}
        <View style={styles.photosSection}>
          <View style={styles.photosSectionHeader}>
            <Text style={styles.photosSectionTitle}>Fotos de esta salida</Text>
            <Text style={styles.photosSectionCount}>{photos.length} fotos</Text>
          </View>

          <TouchableOpacity
            style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
            onPress={handleUploadPhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#E91E8C" size="small" />
            ) : (
              <MaterialIcons name="add-a-photo" size={20} color="#E91E8C" />
            )}
            <Text style={styles.uploadBtnText}>
              {uploading ? "Subiendo..." : "Agregar foto"}
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator color="#E91E8C" style={{ marginTop: 20 }} />
          ) : photos.length === 0 ? (
            <View style={styles.emptyPhotos}>
              <MaterialIcons name="photo-camera" size={40} color="#F8C8D8" />
              <Text style={styles.emptyPhotosText}>Sin fotos aún</Text>
              <Text style={styles.emptyPhotosDesc}>
                Agrega fotos de este momento especial
              </Text>
            </View>
          ) : (
            <View style={styles.photosGrid}>
              {photos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={[
                    styles.photoWrapper,
                    { width: IMG_SIZE, height: IMG_SIZE },
                  ]}
                  onPress={() => setSelectedPhoto(photo)}
                >
                  <Image
                    source={{ uri: photo.cloudinary_url }}
                    style={styles.photo}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal foto */}
      {selectedPhoto && (
        <View style={styles.photoModal}>
          <TouchableOpacity
            style={styles.photoModalClose}
            onPress={() => setSelectedPhoto(null)}
          >
            <MaterialIcons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedPhoto.cloudinary_url }}
            style={styles.photoModalImg}
            resizeMode="contain"
          />
          <View style={styles.photoModalActions}>
            <TouchableOpacity
              style={styles.photoModalBtn}
              onPress={() => handleDownload(selectedPhoto.cloudinary_url)}
            >
              <MaterialIcons name="file-download" size={20} color="#fff" />
              <Text style={styles.photoModalBtnText}> Guardar</Text>
            </TouchableOpacity>
            {selectedPhoto.uploaded_by === user?.id && (
              <TouchableOpacity
                style={[styles.photoModalBtn, styles.photoModalBtnDelete]}
                onPress={() => handleDeletePhoto(selectedPhoto)}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={20}
                  color="#E91E8C"
                />
                <Text style={[styles.photoModalBtnText, { color: "#E91E8C" }]}>
                  {" "}
                  Eliminar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <CustomAlert
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
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
  headerTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 20,
    color: "#C2185B",
    flex: 1,
    textAlign: "center",
  },
  content: { padding: 20, paddingBottom: 60 },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  infoIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FFF0F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoTexts: { flex: 1 },
  infoTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    color: "#3D1A2E",
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: { fontFamily: "Nunito_600SemiBold", fontSize: 12 },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  infoRowTexts: { flex: 1 },
  infoRowLabel: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: "#AD7090",
    marginBottom: 2,
  },
  infoRowValue: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    color: "#3D1A2E",
  },
  infoRowSub: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "#AD7090",
    marginTop: 2,
  },
  photosSection: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  photosSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  photosSectionTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 17,
    color: "#3D1A2E",
  },
  photosSectionCount: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "#AD7090",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF0F3",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#E91E8C",
    marginBottom: 16,
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: "#E91E8C",
  },
  emptyPhotos: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyPhotosText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: "#C2185B",
  },
  emptyPhotosDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#AD7090",
    textAlign: "center",
  },
  photosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  photoWrapper: { borderRadius: 10, overflow: "hidden" },
  photo: { width: "100%", height: "100%" },
  photoModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoModalClose: {
    position: "absolute",
    top: 56,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  photoModalImg: { width: width, height: width },
  photoModalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  photoModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  photoModalBtnDelete: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E91E8C",
  },
  photoModalBtnText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
});
