import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { photosService } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";
import { getSocket } from "../../src/services/socket";
import * as MediaLibrary from "expo-media-library";
import { useCustomAlert } from "../../src/hooks/useCustomAlert";
import CustomAlert from "../../src/components/CustomAlert";
import * as FileSystem from "expo-file-system";

const { width } = Dimensions.get("window");
const IMG_SIZE = (width - 48) / 3;

interface Photo {
  id: string;
  cloudinary_url: string;
  date_title: string;
  uploaded_by_name: string;
  uploaded_by: string;
  created_at: string;
}

export default function MemoriesScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { user } = useAuthStore();
  const { alertState, showAlert, hideAlert } = useCustomAlert();

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = await photosService.getAll();
        if (mounted) setPhotos(res.data);
      } catch {
        if (mounted)
          showAlert("error", "Error", "No se pudieron cargar las fotos");
      } finally {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    fetch();
    return () => {
      mounted = false;
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    photosService
      .getAll()
      .then((res) => setPhotos(res.data))
      .catch(() =>
        showAlert("error", "Error", "No se pudieron cargar las fotos"),
      )
      .finally(() => setRefreshing(false));
  }, []);

  const handleUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
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
      aspect: [1, 1],
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
      const res = await photosService.upload(base64);
      setPhotos((prev) => [res.data, ...prev]);
      showAlert(
        "success",
        "Foto guardada",
        "Tu recuerdo fue guardado exitosamente",
      );
    } catch {
      showAlert("error", "Error", "No se pudo subir la foto");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (photo: Photo) => {
    if (photo.uploaded_by !== user?.id) {
      showAlert(
        "error",
        "Sin permiso",
        "Solo puedes eliminar tus propias fotos",
      );
      return;
    }
    showAlert("confirm", "Eliminar foto", "¿Eliminar este recuerdo?", [
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

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("es-EC", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E91E8C" />
      </View>
    );
  }

  const handleDownload = async (url: string) => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
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
        "La foto fue guardada en tu galería en el álbum Date Planner",
      );
    } catch (error) {
      console.error("Download error:", error);
      showAlert("error", "Error", "No se pudo guardar la foto");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Memorias</Text>
        <Text style={styles.headerSub}>{photos.length} fotos juntos</Text>
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#E91E8C"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="photo-library" size={56} color="#F8C8D8" />
            <Text style={styles.emptyTitle}>Sin fotos aún</Text>
            <Text style={styles.emptyDesc}>
              Sube fotos de sus salidas para recordarlas siempre
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.imgWrapper}
            onPress={() => setSelectedPhoto(item)}
            activeOpacity={0.85}
          >
            <Image source={{ uri: item.cloudinary_url }} style={styles.img} />
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, uploading && styles.fabDisabled]}
        onPress={handleUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <MaterialIcons name="add-a-photo" size={26} color="#fff" />
        )}
      </TouchableOpacity>

      <Modal
        visible={selectedPhoto !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.photoModalOverlay}>
          <TouchableOpacity
            style={styles.photoModalClose}
            onPress={() => setSelectedPhoto(null)}
          >
            <MaterialIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>

          {selectedPhoto && (
            <>
              <Image
                source={{ uri: selectedPhoto.cloudinary_url }}
                style={styles.photoModalImg}
                resizeMode="contain"
              />
              <View style={styles.photoModalInfo}>
                {selectedPhoto.date_title && (
                  <View style={styles.photoInfoRow}>
                    <MaterialIcons
                      name="event"
                      size={16}
                      color="rgba(255,255,255,0.7)"
                    />
                    <Text style={styles.photoModalDate}>
                      {" "}
                      {selectedPhoto.date_title}
                    </Text>
                  </View>
                )}
                <View style={styles.photoInfoRow}>
                  <MaterialIcons
                    name="person"
                    size={16}
                    color="rgba(255,255,255,0.7)"
                  />
                  <Text style={styles.photoModalBy}>
                    {" "}
                    {selectedPhoto.uploaded_by === user?.id
                      ? "Tú"
                      : selectedPhoto.uploaded_by_name}
                  </Text>
                </View>
                <Text style={styles.photoModalCreated}>
                  {formatDate(selectedPhoto.created_at)}
                </Text>
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => handleDownload(selectedPhoto.cloudinary_url)}
                >
                  <MaterialIcons name="file-download" size={18} color="#fff" />
                  <Text style={styles.downloadBtnText}>
                    {" "}
                    Guardar en galería
                  </Text>
                </TouchableOpacity>
                {selectedPhoto.uploaded_by === user?.id && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(selectedPhoto)}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={18}
                      color="#E91E8C"
                    />
                    <Text style={styles.deleteBtnText}> Eliminar foto</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </Modal>
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
  headerSub: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#AD7090",
    marginTop: 2,
  },
  grid: { padding: 16, paddingBottom: 100 },
  imgWrapper: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    margin: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  img: { width: "100%", height: "100%" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontFamily: "Nunito_700Bold", fontSize: 20, color: "#C2185B" },
  emptyDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: "#AD7090",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E91E8C",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E91E8C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabDisabled: { opacity: 0.6 },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
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
  photoModalImg: { width: width, height: width, marginBottom: 24 },
  photoModalInfo: { paddingHorizontal: 24, alignItems: "center" },
  photoInfoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  photoModalDate: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  photoModalBy: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  photoModalCreated: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 24,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E91E8C",
  },
  deleteBtnText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    color: "#E91E8C",
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 12,
  },
  downloadBtnText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
});
