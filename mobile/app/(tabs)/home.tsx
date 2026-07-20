import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useAuthStore } from "../../src/store/authStore";
import { router } from "expo-router";

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

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const { months, days, hours, minutes, seconds, totalDays } = useTimer();
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
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

      {/* Próximas salidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximas salidas</Text>
        <View style={styles.emptyDates}>
          <Text style={styles.emptyEmoji}>🗓️</Text>
          <Text style={styles.emptyText}>No hay salidas planeadas aún</Text>
          <Text style={styles.emptySubtext}>
            Pronto podrás crear y sortear salidas
          </Text>
        </View>
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
            style={[styles.quickCard, styles.quickCardDisabled]}
          >
            <Text style={styles.quickEmoji}>🎲</Text>
            <Text style={styles.quickLabel}>Sortear</Text>
            <Text style={styles.quickSoon}>Pronto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, styles.quickCardDisabled]}
          >
            <Text style={styles.quickEmoji}>📸</Text>
            <Text style={styles.quickLabel}>Memorias</Text>
            <Text style={styles.quickSoon}>Pronto</Text>
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
  section: { paddingHorizontal: 20, marginTop: 8 },
  sectionTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    color: "#3D1A2E",
    marginBottom: 12,
  },
  emptyDates: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: "#C2185B",
    marginBottom: 6,
  },
  emptySubtext: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "#AD7090",
    textAlign: "center",
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
  quickCardDisabled: { opacity: 0.6 },
  quickEmoji: { fontSize: 28, marginBottom: 8 },
  quickLabel: { fontFamily: "Nunito_700Bold", fontSize: 13, color: "#3D1A2E" },
  quickSoon: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    color: "#AD7090",
    marginTop: 4,
  },
});
