import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Linking,
  InteractionManager,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { placesService } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";
import {
  searchPlaces,
  formatAddress,
  NominatimResult,
} from "../../src/services/nominatim";
import { getSocket } from "../../src/services/socket";
import CustomAlert from "../../src/components/CustomAlert";
import { useCustomAlert } from "../../src/hooks/useCustomAlert";

const CATEGORIES = [
  { key: "restaurante", label: "Restaurante", icon: "restaurant" },
  { key: "cafe", label: "Café", icon: "local-cafe" },
  { key: "parque", label: "Parque", icon: "park" },
  { key: "cine", label: "Cine", icon: "local-movies" },
  { key: "playa", label: "Playa", icon: "beach-access" },
  { key: "museo", label: "Museo", icon: "museum" },
  { key: "otro", label: "Otro", icon: "place" },
];

interface Place {
  id: string;
  name: string;
  address: string;
  category: string;
  added_by: string;
  added_by_name: string;
  lat: number | null;
  lng: number | null;
}

export default function PlacesScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("otro");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const searchTimeout = useRef<any>(null);
  const { user } = useAuthStore();

  const { alertState, showAlert, hideAlert } = useCustomAlert();

  useEffect(() => {
    let mounted = true;
    const task = InteractionManager.runAfterInteractions(() => {
      placesService
        .getAll()
        .then((res) => {
          if (mounted) setPlaces(res.data);
        })
        .catch(() => {
          if (mounted)
            showAlert("error", "Error", "No se pudieron cargar los lugares");
        })
        .finally(() => {
          if (mounted) {
            setLoading(false);
            setRefreshing(false);
          }
        });
    });
    return () => {
      mounted = false;
      task.cancel();
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    placesService
      .getAll()
      .then((res) => setPlaces(res.data))
      .catch(() =>
        showAlert("error", "Error", "No se pudieron cargar los lugares"),
      )
      .finally(() => setRefreshing(false));
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(text);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 600);
  };

  const handleSelectResult = (result: NominatimResult) => {
    const addr = formatAddress(result);
    if (!name) setName(result.display_name.split(",")[0]);
    setAddress(addr);
    setSelectedLat(parseFloat(result.lat));
    setSelectedLng(parseFloat(result.lon));
    setSelectedPlaceId(result.place_id);
    setSearchQuery(addr);
    setSearchResults([]);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showAlert("error", "Error", "El nombre es requerido");
      return;
    }
    setSaving(true);
    try {
      await placesService.create({
        name,
        address,
        lat: selectedLat || undefined,
        lng: selectedLng || undefined,
        google_place_id: selectedPlaceId || undefined,
        category,
      });
      setName("");
      setAddress("");
      setCategory("otro");
      setSearchQuery("");
      setSelectedLat(null);
      setSelectedLng(null);
      setSelectedPlaceId(null);
      setModalVisible(false);
    } catch {
      showAlert("error", "Error", "No se pudo agregar el lugar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, placeName: string) => {
    showAlert("confirm", "Eliminar lugar", `¿Eliminar "${placeName}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await placesService.delete(id);
            setPlaces((prev) => prev.filter((p) => p.id !== id));
          } catch {
            showAlert("error", "Error", "No se pudo eliminar");
          }
        },
      },
    ]);
  };

  const getCategoryIcon = (cat: string) =>
    (CATEGORIES.find((c) => c.key === cat)?.icon || "place") as any;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E91E8C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lugares</Text>
        <Text style={styles.headerSub}>
          {places.length} lugares en tu lista
        </Text>
      </View>

      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#E91E8C"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="map" size={56} color="#F8C8D8" />
            <Text style={styles.emptyTitle}>Sin lugares aún</Text>
            <Text style={styles.emptyDesc}>
              Agrega lugares que quieran visitar juntos
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              item.lat && item.lng
                ? Linking.openURL(
                    `https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lng}&zoom=17`,
                  )
                : null
            }
            onLongPress={() => handleDelete(item.id, item.name)}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <MaterialIcons
                name={getCategoryIcon(item.category)}
                size={26}
                color="#E91E8C"
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              {item.address ? (
                <Text style={styles.cardAddress}>{item.address}</Text>
              ) : null}
              <Text style={styles.cardAdded}>
                Agregado por{" "}
                {item.added_by === user?.id ? "ti" : item.added_by_name}
              </Text>
              {item.lat && item.lng && (
                <View style={styles.cardMapRow}>
                  <MaterialIcons name="map" size={12} color="#E91E8C" />
                  <Text style={styles.cardMap}> Ver en mapa</Text>
                </View>
              )}
            </View>
            {item.lat && item.lng && (
              <MaterialIcons name="chevron-right" size={20} color="#C9A0B0" />
            )}
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nuevo lugar</Text>

              <Text style={styles.label}>Buscar lugar</Text>
              <View style={styles.searchContainer}>
                <MaterialIcons
                  name="search"
                  size={20}
                  color="#C9A0B0"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Busca un lugar en Quito..."
                  placeholderTextColor="#C9A0B0"
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
                {searching && (
                  <ActivityIndicator size="small" color="#E91E8C" />
                )}
              </View>

              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  {searchResults.map((result) => (
                    <TouchableOpacity
                      key={result.place_id}
                      style={styles.searchResult}
                      onPress={() => handleSelectResult(result)}
                    >
                      <MaterialIcons name="place" size={16} color="#E91E8C" />
                      <Text style={styles.searchResultText} numberOfLines={2}>
                        {formatAddress(result)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Nombre del lugar</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Café Mosaico"
                placeholderTextColor="#C9A0B0"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Categoría</Text>
              <View style={styles.categories}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.catChip,
                      category === cat.key && styles.catChipActive,
                    ]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <MaterialIcons
                      name={cat.icon as any}
                      size={16}
                      color={category === cat.key ? "#fff" : "#AD7090"}
                    />
                    <Text
                      style={[
                        styles.catChipText,
                        category === cat.key && styles.catChipTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleCreate}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Agregar lugar</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery("");
                  setSearchResults([]);
                  setSelectedLat(null);
                  setSelectedLng(null);
                  setName("");
                  setAddress("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFF0F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: "Nunito_700Bold", fontSize: 16, color: "#3D1A2E" },
  cardAddress: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "#AD7090",
    marginTop: 2,
  },
  cardAdded: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: "#C9A0B0",
    marginTop: 4,
  },
  cardMapRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  cardMap: { fontFamily: "Nunito_400Regular", fontSize: 12, color: "#E91E8C" },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(61,26,46,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
  },
  modalTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 22,
    color: "#C2185B",
    marginBottom: 20,
  },
  label: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    color: "#7D3C5E",
    marginBottom: 6,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F3",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#F8C8D8",
    marginBottom: 8,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: "#3D1A2E",
  },
  searchResults: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F8C8D8",
    marginBottom: 16,
    overflow: "hidden",
  },
  searchResult: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#FFF0F3",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchResultText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "#3D1A2E",
    flex: 1,
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
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFF0F3",
    borderWidth: 1,
    borderColor: "#F8C8D8",
  },
  catChipActive: { backgroundColor: "#E91E8C", borderColor: "#E91E8C" },
  catChipText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#AD7090",
  },
  catChipTextActive: { color: "#fff" },
  saveButton: {
    backgroundColor: "#E91E8C",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontFamily: "Nunito_700Bold", fontSize: 16, color: "#fff" },
  cancelButton: { alignItems: "center", paddingVertical: 8 },
  cancelButtonText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: "#AD7090",
  },
});
