import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from "react-native";
import { useAuthStore } from "../../src/store/authStore";
import { router } from "expo-router";
import { connectionService, datesService } from "../../src/services/api";

const ANNIVERSARY = new Date("2025-08-08T00:00:00");

function useTimer() {
  const [diff, setDiff] = useState(Date.now() - ANNIVERSARY.getTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setDiff(Date.now() - ANNIVERSARY.getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalSeconds = Math.floor(diff / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const days = Math.floor(totalSeconds / 86400);
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  return {
    months,
    days: remainingDays,
    hours,
    minutes,
    seconds,
    totalDays: days,
  };
}

interface Connection {
  points: number;
  level: string;
  levelEmoji: string;
  percentage: number;
  nextLevel: number;
  total_dates_done: number;
  total_photos: number;
  total_places: number;
}

interface DateItem {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
  place_name: string;
  place_category: string;
}

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

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const { months, days, hours, minutes, seconds, totalDays } = useTimer();
  const [refreshing, setRefreshing] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [upcomingDates, setUpcomingDates] = useState<DateItem[]>([]);
  const [barWidth] = useState(new Animated.Value(0));

  const fetchData = async () => {
    try {
      const [connRes, datesRes] = await Promise.all([
        connectionService.get(),
        datesService.getAll(),
      ]);
      setConnection(connRes.data);

      const upcoming = datesRes.data
        .filter(
          (d: DateItem) => d.status !== "done" && d.status !== "cancelled",
        )
        .slice(0, 3);
      setUpcomingDates(upcoming);

      Animated.timing(barWidth, {
        toValue: connRes.data.percentage,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#E91E8C"]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name} 💕</Text>
          <Text style={styles.headerSub}>¿A dónde van hoy?</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Contador */}
      <View style={styles.counterCard}>
        <Text style={styles.counterLabel}>
          Juntos desde el 8 de agosto de 2025
        </Text>
        <View style={styles.counterRow}>
          <View style={styles.counterItem}>
            <Text style={styles.counterNumber}>{months}</Text>
            <Text style={styles.counterUnit}>meses</Text>
          </View>
          <Text style={styles.counterDot}>·</Text>
          <View style={styles.counterItem}>
            <Text style={styles.counterNumber}>{days}</Text>
            <Text style={styles.counterUnit}>días</Text>
          </View>
          <Text style={styles.counterDot}>·</Text>
          <View style={styles.counterItem}>
            <Text style={styles.counterNumber}>{hours}</Text>
            <Text style={styles.counterUnit}>horas</Text>
          </View>
          <Text style={styles.counterDot}>·</Text>
          <View style={styles.counterItem}>
            <Text style={styles.counterNumber}>{minutes}</Text>
            <Text style={styles.counterUnit}>min</Text>
          </View>
          <Text style={styles.counterDot}>·</Text>
          <View style={styles.counterItem}>
            <Text style={styles.counterNumber}>{seconds}</Text>
            <Text style={styles.counterUnit}>seg</Text>
          </View>
        </View>
        <Text style={styles.counterTotal}>{totalDays} días juntos 🌸</Text>
      </View>

      {/* Medidor de conexión */}
      {connection && (
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <Text style={styles.connectionEmoji}>{connection.levelEmoji}</Text>
            <View style={styles.connectionInfo}>
              <Text style={styles.connectionLevel}>{connection.level}</Text>
              <Text style={styles.connectionPoints}>
                {connection.points} puntos de conexión
              </Text>
            </View>
          </View>

          <View style={styles.barContainer}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  width: barWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.barLabel}>
            {connection.percentage}% hacia el siguiente nivel
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {connection.total_dates_done}
              </Text>
              <Text style={styles.statLabel}>Salidas completadas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{connection.total_photos}</Text>
              <Text style={styles.statLabel}>Fotos juntos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{connection.total_places}</Text>
              <Text style={styles.statLabel}>Lugares guardados</Text>
            </View>
          </View>
        </View>
      )}

      {/* Próximas salidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximas salidas</Text>
        {upcomingDates.length === 0 ? (
          <View style={styles.emptyDates}>
            <Text style={styles.emptyEmoji}>🗓️</Text>
            <Text style={styles.emptyText}>No hay salidas planeadas</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/dates")}>
              <Text style={styles.emptyLink}>Planear una salida →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcomingDates.map((date) => (
            <TouchableOpacity
              key={date.id}
              style={styles.dateCard}
              onPress={() => router.push("/(tabs)/dates")}
            >
              <Text style={styles.dateEmoji}>
                {CATEGORY_EMOJI[date.place_category] || "🗓️"}
              </Text>
              <View style={styles.dateInfo}>
                <Text style={styles.dateTitle}>{date.title}</Text>
                <Text style={styles.dateTime}>
                  {formatDate(date.scheduled_at)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Acceso rápido */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acceso rápido</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push("/(tabs)/places")}
          >
            <Text style={styles.quickEmoji}>📍</Text>
            <Text style={styles.quickLabel}>Lugares</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push("/(tabs)/dates")}
          >
            <Text style={styles.quickEmoji}>🎲</Text>
            <Text style={styles.quickLabel}>Sortear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push("/(tabs)/memories")}
          >
            <Text style={styles.quickEmoji}>📸</Text>
            <Text style={styles.quickLabel}>Memorias</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF0F3" },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  greeting: { fontFamily: "Nunito_700Bold", fontSize: 24, color: "#C2185B" },
  headerSub: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#AD7090",
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFF0F3",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F8C8D8",
  },
  logoutText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#AD7090",
  },
  counterCard: {
    margin: 20,
    borderRadius: 24,
    padding: 24,
    backgroundColor: "#E91E8C",
    shadowColor: "#E91E8C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  counterLabel: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 16,
    textAlign: "center",
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  counterItem: { alignItems: "center", minWidth: 40 },
  counterNumber: { fontFamily: "Nunito_700Bold", fontSize: 28, color: "#fff" },
  counterUnit: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
  },
  counterDot: {
    fontFamily: "Nunito_700Bold",
    fontSize: 20,
    color: "rgba(255,255,255,0.5)",
    marginHorizontal: 4,
  },
  counterTotal: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  connectionCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  connectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  connectionEmoji: { fontSize: 36, marginRight: 12 },
  connectionInfo: { flex: 1 },
  connectionLevel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 17,
    color: "#3D1A2E",
  },
  connectionPoints: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "#AD7090",
    marginTop: 2,
  },
  barContainer: {
    height: 10,
    backgroundColor: "#FFF0F3",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 6,
  },
  barFill: {
    height: "100%",
    backgroundColor: "#E91E8C",
    borderRadius: 10,
  },
  barLabel: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: "#AD7090",
    marginBottom: 16,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontFamily: "Nunito_700Bold", fontSize: 22, color: "#C2185B" },
  statLabel: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    color: "#AD7090",
    textAlign: "center",
  },
  statDivider: { width: 1, backgroundColor: "#F8C8D8" },
  section: { paddingHorizontal: 20, marginTop: 16 },
  sectionTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    color: "#3D1A2E",
    marginBottom: 12,
  },
  emptyDates: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyEmoji: { fontSize: 36, marginBottom: 10 },
  emptyText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 15,
    color: "#C2185B",
    marginBottom: 8,
  },
  emptyLink: { fontFamily: "Nunito_700Bold", fontSize: 14, color: "#E91E8C" },
  dateCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  dateEmoji: { fontSize: 28, marginRight: 14 },
  dateInfo: { flex: 1 },
  dateTitle: { fontFamily: "Nunito_700Bold", fontSize: 15, color: "#3D1A2E" },
  dateTime: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "#AD7090",
    marginTop: 2,
  },
  quickRow: { flexDirection: "row", gap: 12 },
  quickCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickEmoji: { fontSize: 28, marginBottom: 8 },
  quickLabel: { fontFamily: "Nunito_700Bold", fontSize: 13, color: "#3D1A2E" },
});
