import { Text, View, Button, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mezsat Uygulamasına Hoşgeldiniz!</Text>
      <Link href="/login" asChild>
        <Button title="Login" />
      </Link>
      <Link href="/register" asChild>
        <Button title="Register" />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
