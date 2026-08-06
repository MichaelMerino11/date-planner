import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { milestonesService } from "../../src/services/api";

interface Milestone {
  type: string;
  days: number;
  label: string;
  emoji: string;
  reached: boolean;
  progress: number;
  daysLeft: number;
  modal_shown: boolean;
}

interface CustomMilestone {
  id: string;
  title: string;
  description: string;
  target_date: string;
  reached: boolean;
  reached_at: string;
}

interface Stats {
  dates_done: string;
  photos: string;
  places: string;
}

const MILESTONE_ICONS: Record<string, string> = {
  "1_month": "favorite-border",
  "100_days": "stars",
  "6_months": "favorite",
  "1_year": "auto-awesome",
  "2_years": "workspace-premium",
};

export default function MilestonesScreen() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [customMilestones, setCustomMilestones] = useState<CustomMilestone[]>(
    [],
  );
  const [daysTogether, setDaysTogether] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [celebration, setCelebration] = useState<Milestone | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchMilestones = async () => {
    try {
      const res = await milestonesService.get();
      setMilestones(res.data.milestones);
      setCustomMilestones(res.data.customMilestones);
      setDaysTogether(res.data.daysTogether);
      setStats(res.data.stats);

      const newlyReached = res.data.milestones.find(
        (m: Milestone) => m.reached && !m.modal_shown,
      );
      if (newlyReached) setCelebration(newlyReached);
    } catch {
      console.error("Error al obtener hitos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = await milestonesService.get();
        if (mounted) {
          setMilestones(res.data.milestones);
          setCustomMilestones(res.data.customMilestones);
          setDaysTogether(res.data.daysTogether);
          setStats(res.data.stats);
          const newlyReached = res.data.milestones.find(
            (m: Milestone) => m.reached && !m.modal_shown,
          );
          if (newlyReached) setCelebration(newlyReached);
        }
      } catch {
        console.error("Error al obtener hitos");
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
    const fetch = async () => {
      try {
        const res = await milestonesService.get();
        setMilestones(res.data.milestones);
        setCustomMilestones(res.data.customMilestones);
        setDaysTogether(res.data.daysTogether);
        setStats(res.data.stats);
      } catch {
        console.error("Error al obtener hitos");
      } finally {
        setRefreshing(false);
      }
    };
    fetch();
  }, []);

  const handleCelebrate = async (type: string) => {
    try {
      await milestonesService.celebrate(type);
      setMilestones((prev) =>
        prev.map((m) => (m.type === type ? { ...m, modal_shown: true } : m)),
      );
      setCelebration(null);
    } catch {
      setCelebration(null);
    }
  };

  const handleMilestonePress = (m: Milestone) => {
    if (m.reached) setCelebration(m);
  };

  const handleCreateCustom = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await milestonesService.createCustom({
        title: newTitle,
        description: newDesc || undefined,
        target_date: newDate || undefined,
      });
      setCustomMilestones((prev) => [res.data, ...prev]);
      setNewTitle("");
      setNewDesc("");
      setNewDate("");
      setAddModal(false);
    } catch {
      console.error("Error al crear hito");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCustom = async (id: string) => {
    try {
      const res = await milestonesService.toggleCustom(id);
      setCustomMilestones((prev) =>
        prev.map((m) => (m.id === id ? res.data : m)),
      );
    } catch {
      console.error("Error al actualizar hito");
    }
  };

  const handleDeleteCustom = (id: string) => {
    setCelebration(null);
    milestonesService
      .deleteCustom(id)
      .then(() => {
        setCustomMilestones((prev) => prev.filter((m) => m.id !== id));
      })
      .catch(console.error);
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
        <Text style={styles.headerTitle}>Hitos</Text>
        <Text style={styles.headerSub}>{daysTogether} días juntos</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#E91E8C"]}
          />
        }
      >
        {/* Stats */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Su historia juntos</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialIcons name="check-circle" size={24} color="#E91E8C" />
                <Text style={styles.statNumber}>{stats.dates_done}</Text>
                <Text style={styles.statLabel}>Salidas{"\n"}completadas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="photo" size={24} color="#E91E8C" />
                <Text style={styles.statNumber}>{stats.photos}</Text>
                <Text style={styles.statLabel}>Fotos{"\n"}juntos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="place" size={24} color="#E91E8C" />
                <Text style={styles.statNumber}>{stats.places}</Text>
                <Text style={styles.statLabel}>Lugares{"\n"}guardados</Text>
              </View>
            </View>
          </View>
        )}

        {/* Hitos de aniversario */}
        <Text style={styles.sectionTitle}>Hitos de aniversario</Text>
        {milestones.map((m) => (
          <TouchableOpacity
            key={m.type}
            style={[
              styles.milestoneCard,
              m.reached && styles.milestoneCardReached,
            ]}
            onPress={() => handleMilestonePress(m)}
            activeOpacity={m.reached ? 0.7 : 1}
          >
            <View style={styles.milestoneLeft}>
              <MaterialIcons
                name={(MILESTONE_ICONS[m.type] || "stars") as any}
                size={32}
                color={m.reached ? "#E91E8C" : "#C9A0B0"}
              />
            </View>
            <View style={styles.milestoneInfo}>
              <Text
                style={[
                  styles.milestoneLabel,
                  m.reached && styles.milestoneLabelReached,
                ]}
              >
                {m.label}
              </Text>
              {m.reached ? (
                <View style={styles.reachedRow}>
                  <MaterialIcons
                    name="check-circle"
                    size={14}
                    color="#0F6E56"
                  />
                  <Text style={styles.milestoneReachedText}>
                    {" "}
                    ¡Lo lograron! Toca para celebrar
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${m.progress}%` }]}
                    />
                  </View>
                  <Text style={styles.milestoneDaysLeft}>
                    {m.daysLeft === 1
                      ? "Falta 1 día"
                      : `Faltan ${m.daysLeft} días`}
                  </Text>
                </>
              )}
            </View>
            {m.reached && (
              <MaterialIcons name="emoji-events" size={28} color="#E91E8C" />
            )}
          </TouchableOpacity>
        ))}

        {/* Hitos personalizados */}
        <View style={styles.customHeader}>
          <Text style={styles.sectionTitle}>Metas de pareja</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setAddModal(true)}
          >
            <MaterialIcons name="add" size={20} color="#E91E8C" />
            <Text style={styles.addBtnText}>Nueva meta</Text>
          </TouchableOpacity>
        </View>

        {customMilestones.length === 0 ? (
          <View style={styles.emptyCustom}>
            <MaterialIcons name="flag" size={40} color="#F8C8D8" />
            <Text style={styles.emptyCustomText}>Sin metas aún</Text>
            <Text style={styles.emptyCustomDesc}>
              Agrega metas que quieran lograr juntos
            </Text>
          </View>
        ) : (
          customMilestones.map((m) => (
            <View
              key={m.id}
              style={[styles.customCard, m.reached && styles.customCardReached]}
            >
              <TouchableOpacity
                style={styles.customCheckbox}
                onPress={() => handleToggleCustom(m.id)}
              >
                <MaterialIcons
                  name={m.reached ? "check-circle" : "radio-button-unchecked"}
                  size={26}
                  color={m.reached ? "#0F6E56" : "#C9A0B0"}
                />
              </TouchableOpacity>
              <View style={styles.customInfo}>
                <Text
                  style={[
                    styles.customTitle,
                    m.reached && styles.customTitleReached,
                  ]}
                >
                  {m.title}
                </Text>
                {m.description && (
                  <Text style={styles.customDesc}>{m.description}</Text>
                )}
                {m.target_date && (
                  <View style={styles.customDateRow}>
                    <MaterialIcons name="event" size={12} color="#AD7090" />
                    <Text style={styles.customDate}>
                      {" "}
                      {new Date(m.target_date).toLocaleDateString("es-EC", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                )}
                {m.reached && m.reached_at && (
                  <View style={styles.customDateRow}>
                    <MaterialIcons name="check" size={12} color="#0F6E56" />
                    <Text style={[styles.customDate, { color: "#0F6E56" }]}>
                      {" "}
                      Logrado el{" "}
                      {new Date(m.reached_at).toLocaleDateString("es-EC", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteCustom(m.id)}
                style={styles.deleteBtn}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={20}
                  color="#C9A0B0"
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal celebración */}
      <Modal
        visible={celebration !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setCelebration(null)}
      >
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationCard}>
            <MaterialIcons
              name={
                (MILESTONE_ICONS[celebration?.type || ""] || "stars") as any
              }
              size={72}
              color="#E91E8C"
            />
            <Text style={styles.celebrationTitle}>¡Felicitaciones!</Text>
            <Text style={styles.celebrationLabel}>{celebration?.label}</Text>
            <Text style={styles.celebrationDesc}>
              Han llegado juntos a este momento especial. ¡Sigan construyendo
              recuerdos hermosos!
            </Text>
            {stats && (
              <View style={styles.celebrationStats}>
                <View style={styles.celebrationStatRow}>
                  <MaterialIcons name="event" size={16} color="#7D3C5E" />
                  <Text style={styles.celebrationStatText}>
                    {" "}
                    {stats.dates_done} salidas juntos
                  </Text>
                </View>
                <View style={styles.celebrationStatRow}>
                  <MaterialIcons name="photo" size={16} color="#7D3C5E" />
                  <Text style={styles.celebrationStatText}>
                    {" "}
                    {stats.photos} fotos compartidas
                  </Text>
                </View>
                <View style={styles.celebrationStatRow}>
                  <MaterialIcons name="place" size={16} color="#7D3C5E" />
                  <Text style={styles.celebrationStatText}>
                    {" "}
                    {stats.places} lugares en su lista
                  </Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={styles.celebrationBtn}
              onPress={() => handleCelebrate(celebration?.type || "")}
            >
              <MaterialIcons name="celebration" size={20} color="#fff" />
              <Text style={styles.celebrationBtnText}> ¡Celebrar!</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.celebrationCloseBtn}
              onPress={() => {
                if (celebration)
                  milestonesService
                    .markModalShown(celebration.type)
                    .catch(console.error);
                setMilestones((prev) =>
                  prev.map((m) =>
                    m.type === celebration?.type
                      ? { ...m, modal_shown: true }
                      : m,
                  ),
                );
                setCelebration(null);
              }}
            >
              <Text style={styles.celebrationCloseBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal nueva meta */}
      <Modal
        visible={addModal}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva meta</Text>
              <TouchableOpacity
                onPress={() => setAddModal(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialIcons name="close" size={20} color="#AD7090" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Título de la meta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Viajar a la playa juntos"
              placeholderTextColor="#C9A0B0"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.label}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Detalles de la meta..."
              placeholderTextColor="#C9A0B0"
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Fecha objetivo (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#C9A0B0"
              value={newDate}
              onChangeText={setNewDate}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleCreateCustom}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="flag" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}> Agregar meta</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  content: { padding: 20, paddingBottom: 100 },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: "#3D1A2E",
    marginBottom: 16,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statNumber: { fontFamily: "Nunito_700Bold", fontSize: 28, color: "#E91E8C" },
  statLabel: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: "#AD7090",
    textAlign: "center",
  },
  statDivider: { width: 1, backgroundColor: "#F8C8D8" },
  sectionTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    color: "#3D1A2E",
    marginBottom: 12,
  },
  milestoneCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
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
  milestoneCardReached: {
    backgroundColor: "#FFF0F3",
    borderWidth: 1.5,
    borderColor: "#E91E8C",
  },
  milestoneLeft: { marginRight: 14 },
  milestoneInfo: { flex: 1 },
  milestoneLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: "#AD7090",
    marginBottom: 6,
  },
  milestoneLabelReached: { color: "#C2185B" },
  reachedRow: { flexDirection: "row", alignItems: "center" },
  milestoneReachedText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#0F6E56",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#F8C8D8",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: { height: "100%", backgroundColor: "#E91E8C", borderRadius: 6 },
  milestoneDaysLeft: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: "#AD7090",
  },
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF0F3",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E91E8C",
  },
  addBtnText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#E91E8C",
  },
  emptyCustom: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyCustomText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: "#C2185B",
  },
  emptyCustomDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#AD7090",
    textAlign: "center",
  },
  customCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  customCardReached: { backgroundColor: "#EAF3DE" },
  customCheckbox: { marginRight: 12, marginTop: 2 },
  customInfo: { flex: 1 },
  customTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: "#3D1A2E",
    marginBottom: 4,
  },
  customTitleReached: { color: "#0F6E56", textDecorationLine: "line-through" },
  customDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "#AD7090",
    marginBottom: 4,
  },
  customDateRow: { flexDirection: "row", alignItems: "center" },
  customDate: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: "#AD7090",
  },
  deleteBtn: { padding: 4 },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: "rgba(61,26,46,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  celebrationCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 32,
    width: "100%",
    alignItems: "center",
    shadowColor: "#E91E8C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  celebrationTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 28,
    color: "#C2185B",
    marginTop: 16,
    marginBottom: 8,
  },
  celebrationLabel: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 18,
    color: "#3D1A2E",
    marginBottom: 12,
  },
  celebrationDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#AD7090",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  celebrationStats: {
    backgroundColor: "#FFF0F3",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginBottom: 24,
    gap: 8,
  },
  celebrationStatRow: { flexDirection: "row", alignItems: "center" },
  celebrationStatText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    color: "#7D3C5E",
  },
  celebrationBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E91E8C",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  celebrationBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  celebrationCloseBtn: { paddingVertical: 8 },
  celebrationCloseBtnText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#AD7090",
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontFamily: "Nunito_700Bold", fontSize: 22, color: "#C2185B" },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF0F3",
    justifyContent: "center",
    alignItems: "center",
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
  inputMulti: { height: 80, textAlignVertical: "top" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E91E8C",
    borderRadius: 14,
    paddingVertical: 16,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: "Nunito_700Bold", fontSize: 16, color: "#fff" },
});
