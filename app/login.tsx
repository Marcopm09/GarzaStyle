import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from 'firebase/firestore';
import React, { useState } from "react";
import { db } from '../firebaseConfig';

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
import { auth } from "../firebaseConfig";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresa tu correo y contraseña.");
      return;
    }

    try {
      // 1. Intentar iniciar sesión en Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Validar si el correo institucional ya fue verificado
      if (!user.emailVerified) {
        Alert.alert(
          "Correo no verificado",
          "Por favor, revisa tu bandeja de entrada (@uaeh.edu.mx) y verifica tu cuenta antes de ingresar."
        );
        return;
      }

      // 3. Si todo está bien, guardar sesión y entrar
      await AsyncStorage.setItem("isLoggedIn", "true");
      const docSnap = await getDoc(doc(db, 'Usuarios', user.uid));
      if (docSnap.data()?.cuestionarioCompletado) {
        router.replace('/(tabs)/Home');
      } else {
        router.replace('/(tabs)/cuestionario');
      }

    } catch (error: any) {
      console.error(error);
      let message = "Credenciales incorrectas o error de conexión.";

      if (error.code === "auth/user-not-found") message = "No existe una cuenta con este correo.";
      if (error.code === "auth/wrong-password") message = "La contraseña es incorrecta.";
      if (error.code === "auth/invalid-credential") message = "Correo o contraseña no válidos.";

      Alert.alert("Error de Inicio", message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Atención", "Ingresa tu correo institucional para enviarte un enlace de recuperación.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Recuperación enviada", "Revisa tu correo @uaeh.edu.mx para restablecer tu contraseña.");
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar el correo de recuperación.");
    }
  };

  const goToRegister = () => {
    router.push("/register");
  };

  const { height, width } = Dimensions.get("window");

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ImageBackground
        source={require("../assets/images/background.png")}
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
                  paddingVertical: height < 700 ? 30 : 50,
                },
              ]}
            >
              <Text style={[styles.title, { fontSize: width < 360 ? 32 : 40 }]}>
                ¡HOLA!
              </Text>

              <Text
                style={[styles.subtitle, { fontSize: width < 360 ? 13 : 16 }]}
              >
                INGRESA CON TU CUENTA GARZA
              </Text>

              <TextInput
                placeholder="Correo @uaeh.edu.mx"
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

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.link}>¿OLVIDASTE TU CONTRASEÑA?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>INGRESAR</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={goToRegister}>
                <Text style={styles.link}>¿NO TIENES CUENTA? REGÍSTRATE</Text>
              </TouchableOpacity>
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
    backgroundColor: "rgba(22, 22, 22, 0.7)",
    borderRadius: 30,
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
    marginBottom: 35,
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    width: "100%",
    backgroundColor: "rgba(226, 205, 205, 0.3)",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    letterSpacing: 2,
    fontSize: 16,
  },
  link: {
    color: "rgba(214, 209, 209, 1)",
    textAlign: "center",
    fontSize: 13,
    marginVertical: 8,
    textDecorationLine: "underline",
  },
});