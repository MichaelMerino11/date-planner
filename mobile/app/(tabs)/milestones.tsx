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
  const [daysTogether, setDaysTogether] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [celebration, setCelebration] = useState<Milestone | null>(null);

  const fetchMilestones = async () => {
    try {
      const res = await milestonesService.get();
      setMilestones(res.data.milestones);
      setDaysTogether(res.data.daysTogether);
      setStats(res.data.stats);

      const newlyReached = res.data.milestones.find(
        (m: Milestone) => m.reached && m.daysLeft === 0,
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
    fetchMilestones();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMilestones();
  }, []);

  const handleCelebrate = async (type: string) => {
    try {
      await milestonesService.celebrate(type);
      setCelebration(null);
    } catch {
      setCelebration(null);
    }
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

        <Text style={styles.sectionTitle}>Tus hitos</Text>
        {milestones.map((m) => (
          <View
            key={m.type}
            style={[
              styles.milestoneCard,
              m.reached && styles.milestoneCardReached,
            ]}
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
                    ¡Lo lograron!
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
          </View>
        ))}
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
  },
  celebrationBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});
