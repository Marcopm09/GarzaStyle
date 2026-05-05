import { router, Stack } from "expo-router";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Image } from "react-native";

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
import { auth, db } from "../firebaseConfig";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleRegister = async () => {
    // 1. Validación de campos obligatorios
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    // 2. Validación estricta del dominio institucional UAEH
    const uaehDomain = "@uaeh.edu.mx";
    if (!email.endsWith(uaehDomain)) {
      Alert.alert(
        "Acceso Restringido",
        "Debes usar tu correo institucional de la UAEH para registrarte."
      );
      return;
    }

    try {
      // 3. Creación del usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 4. Registro de datos en Firestore (Colección Usuarios)
      await setDoc(doc(db, "Usuarios", user.uid), {
        email: user.email,
        uid: user.uid,
        createdAt: new Date(),
        rol: "estudiante",
        cuestionarioCompletado: false
      });

      // 5. Envío de correo de verificación
      await sendEmailVerification(user);

      // 6. Notificación y redirección al Login
      Alert.alert(
        "¡Registro exitoso!",
        "Se ha enviado un enlace de confirmación a tu correo institucional. Por favor, verifícalo para activar tu cuenta.",
        [
          {
            text: "Entendido",
            onPress: () => {
              setEmail("");
              setPassword("");
              router.replace("/login");
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(error);
      let message = "No se pudo completar el registro.";

      if (error.code === "auth/email-already-in-use") {
        message = "Este correo institucional ya está registrado.";
      } else if (error.code === "auth/weak-password") {
        message = "La contraseña debe tener al menos 6 caracteres.";
      } else if (error.code === "auth/invalid-email") {
        message = "El formato del correo no es válido.";
      }

      Alert.alert("Error de Registro", message);
    }
  };

  const goToLogin = () => {
    router.push("/login");
  };

  const { height, width } = Dimensions.get("window");

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ImageBackground
        source={require("../assets/images/background2.png")}
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
                ¡BIENVENIDO!
              </Text>

              <Text
                style={[styles.subtitle, { fontSize: width < 360 ? 13 : 16 }]}
              >
                CREA TU CUENTA INSTITUCIONAL
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

              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Contraseña"
                  placeholderTextColor="#828282ff"
                  value={password}
                  secureTextEntry={!mostrarPassword}
                  onChangeText={setPassword}
                  style={styles.inputPassword}
                />

                <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)}>
                  <Image
                    source={{ uri: "https://cdn-icons-png.flaticon.com/512/159/159604.png" }}
                    style={{ width: 30, height: 30 }}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>REGISTRAR</Text>
              </TouchableOpacity>

              <Text style={styles.link} onPress={goToLogin}>
                ¿YA TIENES CUENTA? INICIA SESIÓN
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
    backgroundColor: "rgba(22, 22, 22, 0.7)", // Opacidad mejorada para legibilidad
    borderRadius: 30,
    paddingHorizontal: 25,
    alignItems: "center",
  },
  title: {
    color: "white",
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: "white",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 30,
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
    marginTop: 15,
    marginBottom: 20,
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
    fontSize: 14,
    textDecorationLine: "underline",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
  },

  inputPassword: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },

  icono: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
});