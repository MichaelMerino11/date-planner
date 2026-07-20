import { Redirect } from "expo-router";
import { useAuthStore } from "../src/store/authStore";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { token, coupleId, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFF0F3",
        }}
      >
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  if (!token) return <Redirect href="/(auth)/login" />;
  if (!coupleId) return <Redirect href="/(auth)/link-couple" />;
  return <Redirect href="/(tabs)/home" />;
}
