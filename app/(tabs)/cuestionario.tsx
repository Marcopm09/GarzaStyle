import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';

import { doc, updateDoc } from 'firebase/firestore';
import {
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { useHora } from '../Hora';

const { width, height } = Dimensions.get('window');
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;
const isSmallDevice = width < 360;
const isTablet = width >= 768;

const GENEROS = ['Masculino', 'Femenino', 'No binario', 'Prefiero no decir'];
const ESTILOS = ['Casual', 'Formal', 'Deportivo', 'Elegante'];
const CLIMAS = ['Frío', 'Templado', 'Caluroso'];

export default function CuestionarioScreen() {
  const hora = useHora();

  const [nombre, setNombre] = useState('');
  const [estatura, setEstatura] = useState('');
  const [peso, setPeso] = useState('');
  const [generoSeleccionado, setGeneroSeleccionado] = useState<string | null>(null);
  const [estiloSeleccionado, setEstiloSeleccionado] = useState<string | null>(null);
  const [climaSeleccionado, setClimaSeleccionado] = useState<string | null>(null);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  const seleccionarFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFotoPerfil(result.assets[0].uri);
    }
  };

  const handleContinuar = async () => {
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, 'Usuarios', user.uid), {
        cuestionarioCompletado: true,
        nombre: nombre,
        estatura: estatura,
        peso: peso,
        genero: generoSeleccionado,
        estilo: estiloSeleccionado,
        clima: climaSeleccionado,
      });
    }
    router.replace('/(tabs)/Home');
  };

  return (
    <ImageBackground

      source={require('@/assets/images/background3.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar hidden />

      {/* ── HEADER ── */}
      <View style={styles.header}>

        {/* AQUI CAMBIA EL LOGO (ROSA) */}
        <Image
          source={require('@/assets/images/Logo_GarzaStyle.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.headerRight}>
          <Text style={styles.horaTexto}>{hora}</Text>
          <Text style={styles.tempTexto}>23°C</Text>
        </View>
      </View>

      <Text style={styles.bienvenidoText}>BIENVENIDO</Text>

      {/* ── CARD ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CUESTIONARIO</Text>
          <View style={styles.divider} />

          {/* ── Foto de perfil ── */}
          <TouchableOpacity style={styles.fotoContainer} onPress={seleccionarFoto}>
            {fotoPerfil ? (
              <Image source={{ uri: fotoPerfil }} style={styles.fotoPerfil} />
            ) : (
              <View style={styles.fotoPlaceholder}>
                {/* CAMBIA EL LOGO DE CAMARA  */}
                <Image
                  source={require('@/assets/images/camaran.png')}
                  style={styles.iconoFoto}
                  resizeMode="contain"
                />
                <Text style={styles.fotoLabel}>Foto de perfil</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ── Nombre ── */}
          <View style={styles.inputRow}>
            {/* ICONO DE PERFIIL*/}
            <Image
              source={require('@/assets/images/perfil.png')}
              style={styles.iconoInput}
              resizeMode="contain"
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor="#999"
              value={nombre}
              onChangeText={setNombre}
            />
          </View>

          {/* ── Estatura ── */}
          <View style={styles.inputRow}>
            {/* ICONO DE ESTATURA */}
            <Image
              source={require('@/assets/images/estatura.png')}
              style={styles.iconoInput}
              resizeMode="contain"
            />
            <TextInput
              style={styles.input}
              placeholder="Estatura (cm)"
              placeholderTextColor="#999"
              value={estatura}
              onChangeText={setEstatura}
              keyboardType="numeric"
            />
          </View>

          {/* ── Peso ── */}
          <View style={styles.inputRow}>
            {/* ICONO DE PESO */}
            <Image
              source={require('@/assets/images/peso.png')}
              style={styles.iconoInput}
              resizeMode="contain"
            />
            <TextInput
              style={styles.input}
              placeholder="Peso (kg)"
              placeholderTextColor="#999"
              value={peso}
              onChangeText={setPeso}
              keyboardType="numeric"
            />
          </View>

          {/* ── Género ── */}
          <View style={styles.seccionContainer}>
            <View style={styles.seccionHeader}>
              {/* ICONO DE GÉNERO */}
              <Image
                source={require('@/assets/images/genero.png')}
                style={styles.iconoInput}
                resizeMode="contain"
              />
              <Text style={styles.seccionLabel}>Género</Text>
            </View>
            <View style={styles.opcionesGrid}>
              {GENEROS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.opcionChip, generoSeleccionado === g && styles.opcionChipSelected]}
                  onPress={() => setGeneroSeleccionado(g)}
                >
                  <Text style={[styles.opcionText, generoSeleccionado === g && styles.opcionTextSelected]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Estilo preferido ── */}
          <View style={styles.seccionContainer}>
            <View style={styles.seccionHeader}>
              {/* ICONO DE ESTILO */}
              <Image
                source={require('@/assets/images/estilo.png')}
                style={styles.iconoInput}
                resizeMode="contain"
              />
              <Text style={styles.seccionLabel}>Estilo preferido</Text>
            </View>
            <View style={styles.opcionesGrid}>
              {ESTILOS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.opcionChip, estiloSeleccionado === e && styles.opcionChipSelected]}
                  onPress={() => setEstiloSeleccionado(e)}
                >
                  <Text style={[styles.opcionText, estiloSeleccionado === e && styles.opcionTextSelected]}>
                    {e}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Clima habitual ── */}
          <View style={styles.seccionContainer}>
            <View style={styles.seccionHeader}>
              {/* ICONO DE CLIMA */}
              <Image
                source={require('@/assets/images/clima.png')}
                style={styles.iconoInput}
                resizeMode="contain"
              />
              <Text style={styles.seccionLabel}>Clima habitual</Text>
            </View>
            <View style={styles.opcionesGrid}>
              {CLIMAS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.opcionChip, climaSeleccionado === c && styles.opcionChipSelected]}
                  onPress={() => setClimaSeleccionado(c)}
                >
                  <Text style={[styles.opcionText, climaSeleccionado === c && styles.opcionTextSelected]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Botón continuar ── */}
          <TouchableOpacity style={styles.botonContinuar} onPress={handleContinuar}>
            <Text style={styles.botonTexto}>CONTINUAR →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: Platform.OS === 'ios' ? hp(5) : hp(3),
  },
  logo: {
    width: isTablet ? wp(40) : wp(50),
    height: isTablet ? hp(10) : hp(12),
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  horaTexto: {
    fontSize: isTablet ? wp(3) : wp(4),
    color: '#d4c399',
    fontWeight: 'bold',
  },
  tempTexto: {
    fontSize: isTablet ? wp(2.5) : wp(3.5),
    color: '#ffffff',
    fontWeight: '600',
  },
  bienvenidoText: {
    fontSize: isSmallDevice ? wp(3.5) : isTablet ? wp(3) : wp(4),
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 3,
    paddingHorizontal: wp(6),
    marginTop: hp(0.5),
    marginBottom: hp(2),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(6),
  },
  card: {
    backgroundColor: '#f5f0e8',
    borderRadius: wp(6),
    padding: wp(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  cardTitle: {
    fontSize: isSmallDevice ? wp(5) : isTablet ? wp(4) : wp(6),
    fontWeight: '900',
    color: '#2a2a2a',
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: hp(1),
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginBottom: hp(2.5),
  },
  fotoContainer: {
    alignSelf: 'center',
    marginBottom: hp(2.5),
  },
  fotoPerfil: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    borderWidth: 3,
    borderColor: '#c1b48b',
  },
  fotoPlaceholder: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    backgroundColor: '#e0dbd0',
    borderWidth: 2,
    borderColor: '#bbb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconoFoto: {
    width: wp(13),
    height: wp(13),
  },
  fotoLabel: {
    fontSize: wp(2.5),
    color: '#888',
    marginTop: hp(0.5),
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: hp(1),
  },
  iconoInput: {
    width: wp(8),
    height: wp(8),
    marginRight: wp(3),
  },
  input: {
    flex: 1,
    fontSize: isSmallDevice ? wp(3.5) : isTablet ? wp(2.8) : wp(4),
    color: '#2a2a2a',
    fontWeight: '600',
  },
  seccionContainer: {
    marginBottom: hp(2.5),
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  seccionLabel: {
    fontSize: isSmallDevice ? wp(3.5) : isTablet ? wp(2.8) : wp(4),
    fontWeight: '700',
    color: '#2a2a2a',
    marginLeft: wp(2),
  },
  opcionesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  opcionChip: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#bbb',
    backgroundColor: '#fff',
  },
  opcionChipSelected: {
    backgroundColor: '#2a2a2a',
    borderColor: '#2a2a2a',
  },
  opcionText: {
    fontSize: isSmallDevice ? wp(3) : isTablet ? wp(2.2) : wp(3.2),
    color: '#555',
    fontWeight: '600',
  },
  opcionTextSelected: {
    color: '#fff',
  },
  botonContinuar: {
    backgroundColor: '#2a2a2a',
    borderRadius: 30,
    paddingVertical: hp(2),
    alignItems: 'center',
    marginTop: hp(2),
  },
  botonTexto: {
    color: '#dbd9d2',
    fontWeight: '900',
    fontSize: isSmallDevice ? wp(3.5) : isTablet ? wp(3) : wp(4.5),
    letterSpacing: 2,
  },
});