import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { datesService, placesService } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

interface Place {
  id: string;
  name: string;
  category: string;
}

interface DateItem {
  id: string;
  title: string;
  notes: string;
  scheduled_at: string;
  status: string;
  is_random: boolean;
  place_name: string;
  place_address: string;
  place_category: string;
  created_by_name: string;
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

const CATEGORY_EMOJI: Record<string, string> = {
  restaurante: "🍽️",
  cafe: "☕",
  parque: "🌳",
  cine: "🎬",
  playa: "🏖️",
  museo: "🏛️",
  otro: "📍",
};

function formatDate(iso: string) {
  if (!iso) return "Sin fecha";
  const d = new Date(iso);
  return d.toLocaleDateString("es-EC", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DatesScreen() {
  const [dates, setDates] = useState<DateItem[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [randomLoading, setRandomLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const [statusModal, setStatusModal] = useState<DateItem | null>(null);

  const fetchAll = async () => {
    try {
      const [datesRes, placesRes] = await Promise.all([
        datesService.getAll(),
        placesService.getAll(),
      ]);
      setDates(datesRes.data);
      setPlaces(placesRes.data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las salidas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "El título es requerido");
      return;
    }
    setSaving(true);
    try {
      const res = await datesService.create({
        title,
        notes,
        place_id: selectedPlace || undefined,
      });
      setDates((prev) => [res.data, ...prev]);
      setTitle("");
      setNotes("");
      setSelectedPlace("");
      setModalVisible(false);
    } catch {
      Alert.alert("Error", "No se pudo crear la salida");
    } finally {
      setSaving(false);
    }
  };

  const handleRandom = async () => {
    if (places.length === 0) {
      Alert.alert(
        "Sin lugares",
        "Agrega lugares primero en la pestaña Lugares",
      );
      return;
    }
    setRandomLoading(true);
    try {
      const res = await datesService.createRandom();
      setDates((prev) => [res.data, ...prev]);
      Alert.alert("🎲 Sorteado!", `Les tocó: ${res.data.place_name}`);
    } catch {
      Alert.alert("Error", "No se pudo sortear");
    } finally {
      setRandomLoading(false);
    }
  };

  const handleStatusChange = (item: DateItem) => {
    setStatusModal(item);
  };

  const handleDelete = (item: DateItem) => {
    Alert.alert("Eliminar salida", `¿Eliminar "${item.title}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await datesService.delete(item.id);
            setDates((prev) => prev.filter((d) => d.id !== item.id));
          } catch {
            Alert.alert("Error", "No se pudo eliminar");
          }
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Salidas 🗓️</Text>
        <Text style={styles.headerSub}>{dates.length} salidas planeadas</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.randomBtn}
          onPress={handleRandom}
          disabled={randomLoading}
        >
          {randomLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.randomBtnText}>🎲 Sortear lugar</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.newBtnText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={dates}
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
            <Text style={styles.emptyEmoji}>🗓️</Text>
            <Text style={styles.emptyTitle}>Sin salidas aún</Text>
            <Text style={styles.emptyDesc}>
              Crea una salida o sortea un lugar
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = STATUS_LABELS[item.status] || STATUS_LABELS.pending;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleStatusChange(item)}
              onLongPress={() => handleDelete(item)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardEmoji}>
                    {CATEGORY_EMOJI[item.place_category] || "🗓️"}
                  </Text>
                  {item.is_random && <Text style={styles.randomBadge}>🎲</Text>}
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {item.place_name && (
                    <Text style={styles.cardPlace}>📍 {item.place_name}</Text>
                  )}
                  {item.place_address && (
                    <Text style={styles.cardAddress}>{item.place_address}</Text>
                  )}
                  <Text style={styles.cardDate}>
                    {formatDate(item.scheduled_at)}
                  </Text>
                </View>
                <View
                  style={[styles.statusBadge, { backgroundColor: status.bg }]}
                >
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              </View>
              {item.notes && <Text style={styles.cardNotes}>{item.notes}</Text>}
              <Text style={styles.cardHint}>
                Toca para cambiar estado · Mantén para eliminar
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nueva salida</Text>

              <Text style={styles.label}>Título</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Cena romántica"
                placeholderTextColor="#C9A0B0"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Lugar (opcional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.placePicker}
              >
                <TouchableOpacity
                  style={[
                    styles.placeChip,
                    selectedPlace === "" && styles.placeChipActive,
                  ]}
                  onPress={() => setSelectedPlace("")}
                >
                  <Text
                    style={[
                      styles.placeChipText,
                      selectedPlace === "" && styles.placeChipTextActive,
                    ]}
                  >
                    Sin lugar
                  </Text>
                </TouchableOpacity>
                {places.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.placeChip,
                      selectedPlace === p.id && styles.placeChipActive,
                    ]}
                    onPress={() => setSelectedPlace(p.id)}
                  >
                    <Text
                      style={[
                        styles.placeChipText,
                        selectedPlace === p.id && styles.placeChipTextActive,
                      ]}
                    >
                      {CATEGORY_EMOJI[p.category]} {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Notas (opcional)</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Reservación, qué llevar, etc."
                placeholderTextColor="#C9A0B0"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleCreate}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Crear salida</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
      <Modal
        visible={statusModal !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setStatusModal(null)}
      >
        <TouchableOpacity
          style={styles.statusOverlay}
          activeOpacity={1}
          onPress={() => setStatusModal(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.statusModal}>
            <View style={styles.statusModalHeader}>
              <Text style={styles.statusModalTitle}>Cambiar estado</Text>
              <TouchableOpacity
                onPress={() => setStatusModal(null)}
                style={styles.statusCloseBtn}
              >
                <Text style={styles.statusCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {statusModal && (
              <Text style={styles.statusModalSub}>{statusModal.title}</Text>
            )}

            <View style={styles.statusOptions}>
              {Object.entries(STATUS_LABELS).map(([key, val]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.statusOption,
                    { backgroundColor: val.bg },
                    statusModal?.status === key && styles.statusOptionActive,
                  ]}
                  onPress={async () => {
                    if (!statusModal || statusModal.status === key) {
                      setStatusModal(null);
                      return;
                    }
                    try {
                      await datesService.updateStatus(statusModal.id, key);
                      setDates((prev) =>
                        prev.map((d) =>
                          d.id === statusModal.id ? { ...d, status: key } : d,
                        ),
                      );
                    } catch {
                      Alert.alert("Error", "No se pudo actualizar el estado");
                    } finally {
                      setStatusModal(null);
                    }
                  }}
                >
                  <Text style={[styles.statusOptionText, { color: val.color }]}>
                    {val.label}
                  </Text>
                  {statusModal?.status === key && (
                    <Text
                      style={[styles.statusOptionCheck, { color: val.color }]}
                    >
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  randomBtn: {
    flex: 1,
    backgroundColor: "#E91E8C",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#E91E8C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  randomBtnText: { fontFamily: "Nunito_700Bold", fontSize: 15, color: "#fff" },
  newBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F8C8D8",
  },
  newBtnText: { fontFamily: "Nunito_700Bold", fontSize: 15, color: "#E91E8C" },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  cardLeft: { alignItems: "center", marginRight: 12 },
  cardEmoji: { fontSize: 28 },
  randomBadge: { fontSize: 14, marginTop: 2 },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: "#3D1A2E",
    marginBottom: 2,
  },
  cardPlace: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#C2185B",
    marginBottom: 2,
  },
  cardAddress: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: "#AD7090",
    marginBottom: 2,
  },
  cardDate: { fontFamily: "Nunito_400Regular", fontSize: 12, color: "#AD7090" },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontFamily: "Nunito_600SemiBold", fontSize: 11 },
  cardNotes: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "#7D3C5E",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#FFF0F3",
  },
  cardHint: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    color: "#C9A0B0",
    marginTop: 8,
    textAlign: "center",
  },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 20,
    color: "#C2185B",
    marginBottom: 8,
  },
  emptyDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: "#AD7090",
    textAlign: "center",
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
  inputMulti: { height: 90, textAlignVertical: "top" },
  placePicker: { marginBottom: 16 },
  placeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFF0F3",
    borderWidth: 1,
    borderColor: "#F8C8D8",
    marginRight: 8,
  },
  placeChipActive: { backgroundColor: "#E91E8C", borderColor: "#E91E8C" },
  placeChipText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#AD7090",
  },
  placeChipTextActive: { color: "#fff" },
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
  statusOverlay: {
    flex: 1,
    backgroundColor: "rgba(61,26,46,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  statusModal: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  statusModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  statusModalTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 20,
    color: "#C2185B",
  },
  statusCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF0F3",
    justifyContent: "center",
    alignItems: "center",
  },
  statusCloseBtnText: {
    fontSize: 14,
    color: "#AD7090",
    fontFamily: "Nunito_700Bold",
  },
  statusModalSub: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#AD7090",
    marginBottom: 20,
  },
  statusOptions: { gap: 10 },
  statusOption: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusOptionActive: {
    borderWidth: 2,
    borderColor: "#E91E8C",
  },
  statusOptionText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
  },
  statusOptionCheck: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
  },
});
