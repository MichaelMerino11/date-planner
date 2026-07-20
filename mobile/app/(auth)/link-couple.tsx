import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";
import { authService } from "../../src/services/api";

export default function LinkCoupleScreen() {
  const [mode, setMode] = useState<"choice" | "join">("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { inviteCode, user, setAuth, token, coupleId } = useAuthStore();

  const handleShare = () => {
    Alert.alert(
      "Tu código de invitación",
      `Comparte este código con tu pareja:\n\n${inviteCode}\n\nElla debe registrarse y luego ingresar este código.`,
      [{ text: "Entendido", style: "default" }],
    );
  };

  const handleJoin = async () => {
    if (!email || !password || !code) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.linkCouple(email, password, code);
      const { token: newToken, user: newUser, couple_id } = res.data;
      await setAuth(newToken, newUser, couple_id);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "join") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.emoji}>🔗</Text>
          <Text style={styles.title}>Ingresar código</Text>
          <Text style={styles.subtitle}>
            Ingresa el código que te compartió tu pareja
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Tu correo</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@correo.com"
              placeholderTextColor="#C9A0B0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Tu contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#C9A0B0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Código de invitación</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="Ej: OZJLYFNS"
              placeholderTextColor="#C9A0B0"
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              autoCapitalize="characters"
              maxLength={8}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleJoin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Vincularme</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setMode("choice")}
            >
              <Text style={styles.linkText}>← Volver</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.emoji}>💑</Text>
        <Text style={styles.title}>Vincular pareja</Text>
        <Text style={styles.subtitle}>
          Para compartir la app con tu pareja necesitan estar vinculados
        </Text>

        <View style={styles.form}>
          {inviteCode && (
            <>
              <Text style={styles.sectionTitle}>
                ¿Eres el primero en registrarte?
              </Text>
              <Text style={styles.sectionDesc}>
                Comparte tu código con tu pareja para que pueda unirse
              </Text>
              <TouchableOpacity style={styles.codeBox} onPress={handleShare}>
                <Text style={styles.codeText}>{inviteCode}</Text>
                <Text style={styles.codeTap}>Toca para ver el código</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>¿Tu pareja ya se registró?</Text>
          <Text style={styles.sectionDesc}>
            Ingresa el código que ella te compartió
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setMode("join")}
          >
            <Text style={styles.buttonText}>Ingresar código</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF0F3",
  },
  inner: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emoji: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    fontFamily: "Nunito_700Bold",
    fontSize: 30,
    color: "#C2185B",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: "#AD7090",
    textAlign: "center",
    marginBottom: 40,
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#C2185B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: "#7D3C5E",
    marginBottom: 4,
  },
  sectionDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "#AD7090",
    marginBottom: 16,
  },
  codeBox: {
    backgroundColor: "#FFF0F3",
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F8C8D8",
    borderStyle: "dashed",
    marginBottom: 8,
  },
  codeText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 28,
    color: "#E91E8C",
    letterSpacing: 6,
  },
  codeTap: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: "#AD7090",
    marginTop: 4,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#F8C8D8",
  },
  dividerText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#AD7090",
    marginHorizontal: 12,
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
  codeInput: {
    fontFamily: "Nunito_700Bold",
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 6,
  },
  button: {
    backgroundColor: "#E91E8C",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  linkButton: {
    alignItems: "center",
  },
  linkText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#AD7090",
  },
});
