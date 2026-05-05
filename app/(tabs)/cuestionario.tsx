import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import React, { useState } from 'react';
import {
  Alert, Dimensions,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db, storage } from '../../firebaseConfig';
import { useHora } from '../Hora';

const { width, height } = Dimensions.get('window');
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;
const isSmallDevice = width < 360;
const isTablet = width >= 768;

const GENEROS = ['Masculino', 'Femenino', 'No binario', 'Prefiero no decir'];
const ESTILOS = ['Casual', 'Formal', 'Deportivo', 'Elegante'];
const CLIMAS = ['Frío', 'Templado', 'Caluroso'];

// Secciones de prendas iniciales
const PRENDAS_INICIALES = [
  { key: 'Camisas / Playeras', label: 'Camisa', obligatorio: true },
  { key: 'Pantalones / Shorts / Faldas', label: 'Pantalón', obligatorio: true },
  { key: 'Tenis / Zapatos', label: 'Zapatos', obligatorio: true },
  { key: 'Accesorios', label: 'Accesorios', obligatorio: true },
];

export default function CuestionarioScreen() {
  const hora = useHora();

  const [nombre, setNombre] = useState('');
  const [estatura, setEstatura] = useState('');
  const [peso, setPeso] = useState('');
  const [generoSeleccionado, setGeneroSeleccionado] = useState<string | null>(null);
  const [estiloSeleccionado, setEstiloSeleccionado] = useState<string | null>(null);
  const [climaSeleccionado, setClimaSeleccionado] = useState<string | null>(null);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  // Estado para las fotos de prendas iniciales: { [seccion]: uri | null }
  const [fotosPrendas, setFotosPrendas] = useState<{ [key: string]: string | null }>({
    'Camisas / Playeras': null,
    'Pantalones / Shorts / Faldas': null,
    'Tenis / Zapatos': null,
    'Accesorios': null,
  });

  // ─── Foto de perfil ───────────────────────────────────────────────────────
  const seleccionarFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `Perfiles/${user.uid}/imagen_perfil.jpg`);
      await uploadBytesResumable(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      setFotoPerfil(downloadURL);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo subir la foto');
    }
  };

  // ─── Foto de prenda (cámara o galería) ────────────────────────────────────
  const abrirCamaraPrenda = async (seccion: string) => {
    Alert.alert(
      'Agregar prenda',
      '¿Cómo quieres agregar la foto?',
      [
        {
          text: 'Cámara',
          onPress: () => capturarPrenda(seccion, 'camera'),
        },
        {
          text: 'Galería',
          onPress: () => capturarPrenda(seccion, 'gallery'),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const capturarPrenda = async (seccion: string, fuente: 'camera' | 'gallery') => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (fuente === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (result.canceled) return;

      // Guardamos la URI localmente para mostrar la preview
      setFotosPrendas(prev => ({ ...prev, [seccion]: result.assets[0].uri }));
    } catch (error) {
      console.error('Error capturando prenda:', error);
      Alert.alert('Error', 'No se pudo obtener la foto');
    }
  };

  // ─── Subir una prenda a Firebase ──────────────────────────────────────────
  const subirPrenda = async (usuarioID: string, seccion: string, uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const timestamp = Date.now();
    const storagePath = `prendas/${usuarioID}/${timestamp}.jpg`;
    const storageRefPath = ref(storage, storagePath);

    await uploadBytesResumable(storageRefPath, blob);
    const downloadURL = await getDownloadURL(storageRefPath);

    await addDoc(collection(db, 'Prendas'), {
      usuarioID,
      nombre: 'Nombre temporal',
      talla: 'M',
      fotoURL: downloadURL,
      storagePath,
      fechaSubida: new Date().toISOString(),
      publica: false,
      seccion,
    });
  };

  // ─── Continuar ─────────────────────────────────────────────────────────────
  const handleContinuar = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Validar campos de texto
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu nombre');
      return;
    }
    if (!estatura.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu estatura');
      return;
    }
    if (!peso.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu peso');
      return;
    }

    // Validar selecciones
    if (!generoSeleccionado) {
      Alert.alert('Campo requerido', 'Por favor selecciona tu género');
      return;
    }
    if (!estiloSeleccionado) {
      Alert.alert('Campo requerido', 'Por favor selecciona tu estilo preferido');
      return;
    }
    if (!climaSeleccionado) {
      Alert.alert('Campo requerido', 'Por favor selecciona tu clima habitual');
      return;
    }

    // Validar foto de perfil
    if (!fotoPerfil) {
      Alert.alert('Foto requerida', 'Por favor agrega una foto de perfil');
      return;
    }

    // Validar todas las prendas
    const prendaFaltante = PRENDAS_INICIALES.find(p => !fotosPrendas[p.key]);
    if (prendaFaltante) {
      Alert.alert('Prenda requerida', `Por favor agrega una foto de ${prendaFaltante.label}`);
      return;
    }

    try {
      await updateDoc(doc(db, 'Usuarios', user.uid), {
        cuestionarioCompletado: true,
        nombre,
        estatura,
        peso,
        genero: generoSeleccionado,
        estilo: estiloSeleccionado,
        clima: climaSeleccionado,
        urlImagenPerfil: fotoPerfil || '',
      });

      const promesas = PRENDAS_INICIALES
        .filter(p => fotosPrendas[p.key] !== null)
        .map(p => subirPrenda(user.uid, p.key, fotosPrendas[p.key]!));

      await Promise.all(promesas);

      router.replace('/(tabs)/Home');
    } catch (error) {
      console.error('Error guardando cuestionario:', error);
      Alert.alert('Error', 'No se pudo guardar la información');
    }
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
                {/* CAMBIA EL LOGO DE CAMARA */}
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
            {/* ICONO DE PERFIL */}
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

          {/* ════════════════════════════════════════════════════════════════
              ── NUEVA SECCIÓN: PRIMERAS PRENDAS ──
          ════════════════════════════════════════════════════════════════ */}
          <View style={styles.divider} />

          <View style={styles.primerasPrendasHeader}>
            {/* ICONO DE SECCIÓN PRENDAS — pon aquí el ícono que prefieras */}
            {/* <Image source={require('@/assets/images/TU_ICONO.png')} style={styles.iconoPrendas} resizeMode="contain" /> */}
            <Text style={styles.primerasPrendasTitulo}>
              Agrega tus primeras prendas a tu armario
            </Text>
          </View>

          <View style={styles.prendasGrid}>
            {PRENDAS_INICIALES.map((prenda) => {
              const tieneFoto = fotosPrendas[prenda.key] !== null;

              return (
                <TouchableOpacity
                  key={prenda.key}
                  style={[
                    styles.prendaItem,
                    tieneFoto && styles.prendaItemConFoto,
                  ]}
                  onPress={() => abrirCamaraPrenda(prenda.key)}
                  activeOpacity={0.75}
                >
                  {tieneFoto ? (
                    // Vista previa de la foto seleccionada
                    <>
                      <Image
                        source={{ uri: fotosPrendas[prenda.key]! }}
                        style={styles.prendaPreview}
                      />
                      {/* Ícono de editar encima de la foto */}
                      <View style={styles.prendaEditOverlay}>
                        <Text style={styles.prendaEditIcon}>✎</Text>
                      </View>
                    </>
                  ) : (
                    // Estado vacío
                    <>
                      {/*
                        ── MARCADOR DE ICONO ──
                        Reemplaza el comentario de abajo con tu <Image> cuando tengas el asset.

                        CAMISA:     require('@/assets/images/Camisa.png')
                        PANTALON:   require('@/assets/images/Pantalon.png')
                        ZAPATOS:    require('@/assets/images/TU_ICONO_ZAPATOS.png')
                        ACCESORIOS: require('@/assets/images/TU_ICONO_ACCESORIOS.png')

                        Ejemplo:
                        <Image
                          source={require('@/assets/images/Camisa.png')}
                          style={styles.prendaIcono}
                          resizeMode="contain"
                        />
                      */}
                      <View style={styles.prendaIconoPlaceholder}>
                        <Text style={styles.prendaIconoTexto}>📷</Text>
                      </View>

                      <Text style={styles.prendaLabel}>
                        {prenda.label}
                        {!prenda.obligatorio && (
                          <Text style={styles.opcionalTag}> (opcional)</Text>
                        )}
                      </Text>

                      <View style={styles.prendaAgregarBtn}>
                        <Text style={styles.prendaAgregarTexto}>+ Agregar</Text>
                      </View>
                    </>
                  )}

                  {/* Etiqueta de nombre siempre visible cuando hay foto */}
                  {tieneFoto && (
                    <View style={styles.prendaLabelOverlay}>
                      <Text style={styles.prendaLabelOverlayTexto}>{prenda.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {/* ════════════════════════════════════════════════════════════════ */}

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
    marginTop: hp(1),
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

  // ── Nuevos estilos: sección primeras prendas ────────────────────────────
  primerasPrendasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
    gap: wp(2),
  },
  iconoPrendas: {
    // Espacio reservado para el ícono de la sección
    // Descomenta y ajusta cuando tengas el asset:
    // width: wp(8),
    // height: wp(8),
  },
  primerasPrendasTitulo: {
    flex: 1,
    fontSize: isSmallDevice ? wp(3.8) : isTablet ? wp(3) : wp(4.2),
    fontWeight: '800',
    color: '#2a2a2a',
    letterSpacing: 0.5,
  },
  prendasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: hp(1.5),
    marginBottom: hp(3),
  },
  prendaItem: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: wp(4),
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(3),
    overflow: 'hidden',
    position: 'relative',
  },
  prendaItemConFoto: {
    borderStyle: 'solid',
    borderColor: '#c1b48b',
    borderWidth: 2.5,
    padding: 0,
  },
  prendaPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  prendaEditOverlay: {
    position: 'absolute',
    top: wp(2),
    right: wp(2),
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: wp(3),
    width: wp(7),
    height: wp(7),
    justifyContent: 'center',
    alignItems: 'center',
  },
  prendaEditIcon: {
    color: '#fff',
    fontSize: wp(4),
  },
  prendaLabelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: hp(0.6),
    alignItems: 'center',
  },
  prendaLabelOverlayTexto: {
    color: '#fff',
    fontSize: isSmallDevice ? wp(2.8) : wp(3),
    fontWeight: '700',
  },
  prendaIconoPlaceholder: {
    marginBottom: hp(0.8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  prendaIconoTexto: {
    // Este texto emoji es temporal — reemplázalo con <Image> cuando tengas el asset
    fontSize: wp(8),
  },
  prendaLabel: {
    fontSize: isSmallDevice ? wp(3) : isTablet ? wp(2.5) : wp(3.5),
    fontWeight: '700',
    color: '#2a2a2a',
    textAlign: 'center',
    marginBottom: hp(0.8),
  },
  opcionalTag: {
    fontSize: isSmallDevice ? wp(2.5) : wp(3),
    fontWeight: '400',
    color: '#999',
  },
  prendaAgregarBtn: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.5),
  },
  prendaAgregarTexto: {
    color: '#fff',
    fontSize: isSmallDevice ? wp(2.5) : wp(3),
    fontWeight: '700',
  },
  // ────────────────────────────────────────────────────────────────────────

  botonContinuar: {
    backgroundColor: '#2a2a2a',
    borderRadius: 30,
    paddingVertical: hp(2),
    alignItems: 'center',
    marginTop: hp(1),
  },
  botonTexto: {
    color: '#dbd9d2',
    fontWeight: '900',
    fontSize: isSmallDevice ? wp(3.5) : isTablet ? wp(3) : wp(4.5),
    letterSpacing: 2,
  },
});