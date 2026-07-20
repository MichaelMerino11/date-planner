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
} from "react-native";
import { Link, router } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";
import { authService } from "../../src/services/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      const { token, user, couple_id } = res.data;
      await setAuth(token, user, couple_id);
      if (couple_id) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/(auth)/link-couple");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Error al iniciar sesión",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.emoji}>💕</Text>
        <Text style={styles.title}>Date Planner</Text>
        <Text style={styles.subtitle}>
          Tu espacio para planear momentos juntos
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Correo</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@correo.com"
            placeholderTextColor="#C9A0B0"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#C9A0B0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>
                ¿No tienes cuenta?{" "}
                <Text style={styles.linkBold}>Regístrate</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF0F3",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    fontFamily: "Nunito_700Bold",
    fontSize: 32,
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
  linkBold: {
    fontFamily: "Nunito_700Bold",
    color: "#E91E8C",
  },
});
