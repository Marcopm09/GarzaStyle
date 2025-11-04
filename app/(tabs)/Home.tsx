import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useHora } from '../Hora';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../FirebaseConfig'; // Asegúrate de tener configurado Firebase

// Obtenemos dimensiones de pantalla
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HoraLocalScreen() {
  const hora = useHora();
  const [menuVisible, setMenuVisible] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // 🔹 Cargar nombre desde Firestore
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const usuarioID = 'usuario1'; // cámbialo o hazlo dinámico si usas auth
        const docRef = doc(db, 'Usuarios', usuarioID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNombreUsuario(docSnap.data().nombre);
        } else {
          console.log('No se encontró el usuario');
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
      }
    };

    cargarUsuario();
  }, []);

  return (
    <View style={style.container}>

      <View style={style.menu}>
        <TouchableOpacity onPress={() => router.push('/Armario')}>
          <Image
            source={require('@/assets/images/Gancho.png')}
            style={style.menuImage}
          />
        </TouchableOpacity>

        <Image
          source={require('@/assets/images/Camara.png')}
          style={style.menuImage}
        />

        <TouchableOpacity onPress={() => console.log('Funciona')}>
          <Image
            source={require('@/assets/images/Camisa.png')}
            style={style.menuImage}
          />
        </TouchableOpacity>

        <Image
          source={require('@/assets/images/Pantalon.png')}
          style={style.menuImage}
        />

        <Image
          source={require('@/assets/images/Guardar.png')}
          style={style.menuImage}
        />
      </View>

      {/* Hora actual */}
      <Text style={style.horaTexto}>{hora}</Text>

      {/* Bienvenida dinámica */}
      <Text style={style.subtitle}>¡Bienvenido {nombreUsuario}!</Text>

      {/* Logo */}
      <Image
        source={require('@/assets/images/Logo_GarzaStyle.png')}
        style={style.GarzaLogo}
      />

      {/* Redes */}
      <View style={style.menuRedes}>
        <TouchableOpacity onPress={() => console.log('Compartir')}>
          <Image
            source={require('@/assets/images/compartir.png')}
            style={style.menuImageRedes}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => console.log('Corazón')}>
          <Image
            source={require('@/assets/images/corazon.png')}
            style={style.menuImageRedes}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => console.log('Enviar')}>
          <Image
            source={require('@/assets/images/enviar.png')}
            style={style.menuImageRedes}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  subtitle: {
    fontSize: screenWidth * 0.05,
    fontWeight: 'bold',
    color: 'white',
    position: 'absolute',
    top: screenHeight * 0.18,
    left: screenWidth * 0.07,
  },

  GarzaLogo: {
    position: 'absolute',
    height: screenHeight * 0.2,
    width: screenWidth * 0.6,
    resizeMode: 'contain',
    top: screenHeight * 0.02,
  },

  horaTexto: {
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
    color: '#ffffffff',
    position: 'absolute',
    top: screenHeight * 0.05,
    right: screenWidth * 0.05,
  },

  menu: {
    position: 'absolute',
    top: screenHeight * 0.2,
    right: screenWidth * 0.03,
    width: screenWidth * 0.25,
    height: screenHeight * 0.5,
    backgroundColor: '#e3e3e3ff',
    padding: screenWidth * 0.04,
    borderRadius: 15,
    shadowColor: '#000000ff',
    shadowOpacity: 0.3,
    shadowOffset: { width: -2, height: 2 },
    elevation: 5,
    zIndex: 10,
  },

  menuImage: {
    height: screenHeight * 0.06,
    width: '100%',
    resizeMode: 'contain',
    marginBottom: screenHeight * 0.015,
  },

  menuRedes: {
    position: 'absolute',
    bottom: screenHeight * 0.05,
    width: '90%',
    backgroundColor: '#0f0f0fff',
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: screenHeight * 0.015,
    shadowColor: '#000000ff',
    shadowOpacity: 0.3,
    elevation: 5,
  },

  menuImageRedes: {
    height: screenHeight * 0.08,
    width: screenWidth * 0.15,
    resizeMode: 'contain',
  },
});

