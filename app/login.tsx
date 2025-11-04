import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Dimensions,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (email && password) {
      await AsyncStorage.setItem("isLoggedIn", "true");
      router.replace("/(tabs)/Home");
    } else {
      Alert.alert("Error", "Por favor ingresa tu correo y contraseña.");
    }
  };

  const goToRegister = () => {
    router.push("/register");
  };

  const { height, width } = Dimensions.get("window");

  return (
    <>
      {/* 🔥 Esto quita la barra negra del header */}
      <Stack.Screen options={{ headerShown: false }} />

      <ImageBackground
        source={require("../assets/images/background.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContainer,
              { paddingVertical: height * 0.1 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[
                styles.overlay,
                {
                  width: width * 0.85,
                  paddingVertical: height < 700 ? 20 : 40,
                },
              ]}
            >
              <Text style={[styles.title, { fontSize: width < 360 ? 32 : 40 }]}>
                ¡HOLA!
              </Text>

              <Text
                style={[styles.subtitle, { fontSize: width < 360 ? 13 : 16 }]}
              >
                INGRESA CON TU CUENTA
              </Text>

              <TextInput
                placeholder="Dirección de correo"
                placeholderTextColor="#828282ff"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                placeholder="Contraseña"
                placeholderTextColor="#828282ff"
                value={password}
                secureTextEntry
                onChangeText={setPassword}
                style={styles.input}
              />

              <Text style={styles.link}>¿OLVIDASTE TU CONTRASEÑA?</Text>

              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>INGRESAR</Text>
              </TouchableOpacity>

              <Text style={styles.link} onPress={goToRegister}>
                ¿NO TIENES CUENTA?
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    backgroundColor: "rgba(22, 22, 22, 0.4)",
    borderRadius: 25,
    paddingHorizontal: 25,
    alignItems: "center",
  },
  title: {
    color: "white",
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    color: "white",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 40,
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 14,
  },
  button: {
    width: "100%",
    backgroundColor: "rgba(226, 205, 205, 0.2)",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  link: {
    color: "rgba(214, 209, 209, 1)",
    textAlign: "center",
    fontSize: 13,
    marginVertical: 4,
  },
});
