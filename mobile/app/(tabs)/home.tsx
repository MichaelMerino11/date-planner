import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🏠 Home — Etapa 2 viene aquí</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF0F3",
  },
  text: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    color: "#C2185B",
  },
});
