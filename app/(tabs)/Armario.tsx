import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db, storage } from '../../firebaseConfig';
import { useHora } from '../Hora';

const { width, height } = Dimensions.get('window');

// Funciones responsivas
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

// Detección de tamaño de dispositivo
const isSmallDevice = width < 360;
const isMediumDevice = width >= 360 && width < 400;
const isTablet = width >= 768;

export default function HoraLocalScreen() {
  const hora = useHora();
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string>('');
  const [imagenSeleccionada, setImagenSeleccionada] = useState<{
    uri: string;
    seccion: string;
    docId?: string;
  } | null>(null);
  const [imagenesPorSeccion, setImagenesPorSeccion] = useState<{ 
    [key: string]: { uri: string; docId: string }[] 
  }>({
    Accesorios: [],
    'Camisas / Playeras': [],
    'Pantalones / Shorts / Faldas': [],
    'Tenis / Zapatos': [],
  });
  
  const [mensajeVisible, setMensajeVisible] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const cargarImagenes = async () => {
      try {
        const secciones = [
          'Accesorios',
          'Camisas / Playeras',
          'Pantalones / Shorts / Faldas',
          'Tenis / Zapatos',
        ];
        const nuevasImagenes: { [key: string]: any[] } = {};

        for (const seccion of secciones) {
          const q = query(
            collection(db, 'Prendas'),
            where('usuarioID', '==', 'usuario1'),
            where('seccion', '==', seccion)
          );
          const snapshot = await getDocs(q);
          nuevasImagenes[seccion] = snapshot.docs.map((doc) => ({
            uri: doc.data().fotoURL,
            docId: doc.id,
          }));
        }

        setImagenesPorSeccion(nuevasImagenes);
      } catch (error) {
        console.error('❌ Error cargando imágenes:', error);
      }
    };

    cargarImagenes();
  }, []);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setMensajeVisible(true);
    setTimeout(() => {
      setMensajeVisible(false);
    }, 2000);
  };

  const eliminarImagen = async () => {
    if (!imagenSeleccionada) return;

    Alert.alert(
      '¿Eliminar imagen?',
      'Esta acción no se puede deshacer',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const imagenAEliminar = imagenSeleccionada;
            setImagenSeleccionada(null);
            
            try {
              if (imagenAEliminar.docId) {
                await deleteDoc(doc(db, 'Prendas', imagenAEliminar.docId));
              }

              const imageRef = ref(storage, imagenAEliminar.uri);
              await deleteObject(imageRef);

              setImagenesPorSeccion((prev) => ({
                ...prev,
                [imagenAEliminar.seccion]: prev[imagenAEliminar.seccion].filter(
                  (img) => img.uri !== imagenAEliminar.uri
                ),
              }));

              mostrarMensaje('✅ Imagen eliminada');
            } catch (error) {
              console.error('❌ Error eliminando imagen:', error);
              mostrarMensaje('❌ Error al eliminar');
            }
          },
        },
      ]
    );
  };

  const subirImagen = async (usuarioID: string, seccion: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        mostrarMensaje('Permiso denegado');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;
      const asset = result.assets[0];
      const uri = asset.uri;

      const response = await fetch(uri);
      const blob = await response.blob();

      const timestamp = Date.now();
      const storagePath = `prendas/${usuarioID}/${timestamp}.jpg`;
      const storageRefPath = ref(storage, storagePath);

      await uploadBytesResumable(storageRefPath, blob);
      const downloadURL = await getDownloadURL(storageRefPath);

      const docRef = await addDoc(collection(db, 'Prendas'), {
        usuarioID,
        nombre: 'Nombre temporal',
        talla: 'M',
        fotoURL: downloadURL,
        storagePath,
        fechaSubida: new Date().toISOString(),
        publica: false,
        seccion,
      });

      setImagenesPorSeccion((prev) => ({
        ...prev,
        [seccion]: [...prev[seccion], { uri: downloadURL, docId: docRef.id }],
      }));

      mostrarMensaje('✅ Imagen subida');
    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      mostrarMensaje('❌ Error al subir');
    }
  };

  const tomarFoto = async (usuarioID: string, seccion: string) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        mostrarMensaje('Permiso denegado');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;
      const asset = result.assets[0];
      const uri = asset.uri;

      const response = await fetch(uri);
      const blob = await response.blob();

      const timestamp = Date.now();
      const storagePath = `prendas/${usuarioID}/${timestamp}.jpg`;
      const storageRefPath = ref(storage, storagePath);

      await uploadBytesResumable(storageRefPath, blob);
      const downloadURL = await getDownloadURL(storageRefPath);

      const docRef = await addDoc(collection(db, 'Prendas'), {
        usuarioID,
        nombre: 'Nombre temporal',
        talla: 'M',
        fotoURL: downloadURL,
        storagePath,
        fechaSubida: new Date().toISOString(),
        publica: false,
        seccion,
      });

      setImagenesPorSeccion((prev) => ({
        ...prev,
        [seccion]: [...prev[seccion], { uri: downloadURL, docId: docRef.id }],
      }));

      mostrarMensaje('✅ Foto guardada');
    } catch (error) {
      console.error('❌ Error tomando foto:', error);
      mostrarMensaje('❌ Error al tomar foto');
    }
  };

  return (
    <View style={style.container}>
      <StatusBar hidden={true} />
      
      <TouchableOpacity style={style.menuButton} onPress={toggleMenu}>
        <Text style={style.menuIcon}>☰</Text>
      </TouchableOpacity>

      {menuVisible && (
        <>
          <Pressable style={style.overlay} onPress={toggleMenu} />
          <View style={style.menu}>
            <TouchableOpacity onPress={() => router.push('/Home')}>
              <Image source={require('@/assets/images/House.png')} style={style.menuImage} />
            </TouchableOpacity>

            <TouchableOpacity>
              <Image source={require('@/assets/images/Camara.png')} style={style.menuImage} />
            </TouchableOpacity>

            <TouchableOpacity>
              <Image source={require('@/assets/images/Camisa.png')} style={style.menuImage} />
            </TouchableOpacity>

            <TouchableOpacity>
              <Image source={require('@/assets/images/Pantalon.png')} style={style.menuImage} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/Guardados')}>
              <Image source={require('@/assets/images/Guardar.png')} style={style.menuImage} />
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={style.horaTexto}>{hora}</Text>
      <Text style={style.subtitle}>Tu armario digital!!</Text>
      <Image source={require('@/assets/images/Logo_GarzaStyle.png')} style={style.GarzaLogo} />

      <ScrollView
        style={style.scrollContainer}
        contentContainerStyle={{ paddingBottom: hp(10) }}
        showsVerticalScrollIndicator={false}
      >
        {['Accesorios', 'Camisas / Playeras', 'Pantalones / Shorts / Faldas', 'Tenis / Zapatos'].map(
          (title, idx) => (
            <View key={idx} style={style.section}>
              <Text style={style.sectionTitle}>{title}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={style.placeholderItem}
                  onPress={() => {
                    setSeccionSeleccionada(title);
                    setModalVisible(true);
                  }}
                >
                  <Text style={style.plusIcon}>+</Text>
                </TouchableOpacity>

                {imagenesPorSeccion[title].map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={style.placeholderItem}
                    onPress={() => setImagenSeleccionada({ uri: item.uri, seccion: title, docId: item.docId })}
                  >
                    <Image source={{ uri: item.uri }} style={style.imageItem} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )
        )}

        <TouchableOpacity 
          style={style.bottomButton} 
          onPress={() => mostrarMensaje('Próximamente...')}
        >
          <Image
            source={require('@/assets/images/bolsa.png')}
            style={style.bottomButtonImage}
          />
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={modalVisible} animationType="fade">
        <Pressable style={style.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={style.modalContent}>
            <TouchableOpacity
              style={style.modalButton}
              onPress={() => {
                setModalVisible(false);
                subirImagen('usuario1', seccionSeleccionada);
              }}
            >
              <Text style={style.textoModalButton}>Galería</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={style.modalButton} 
              onPress={() => {
                setModalVisible(false); 
                tomarFoto('usuario1', seccionSeleccionada);
              }}
            >
              <Text style={style.textoModalButton}>Cámara</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={imagenSeleccionada !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setImagenSeleccionada(null)}
      >
        <View style={style.modalImagenCompleta}>
          <Pressable
            style={style.modalImagenFondo}
            onPress={() => setImagenSeleccionada(null)}
          />
          
          <View style={style.contenedorImagenGrande}>
            <Image
              source={{ uri: imagenSeleccionada?.uri }}
              style={style.imagenGrande}
              resizeMode="contain"
            />
          </View>

          <View style={style.botonesImagen}>
            <TouchableOpacity
              style={[style.botonAccion, style.botonEliminar]}
              onPress={eliminarImagen}
            >
              <Text style={style.textoBoton}>🗑️ Eliminar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[style.botonAccion, style.botonCerrar]}
              onPress={() => setImagenSeleccionada(null)}
            >
              <Text style={style.textoBoton}>✕ Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {mensajeVisible && (
        <View style={style.mensajeContainer}>
          <Text style={style.mensajeTexto}>{mensaje}</Text>
        </View>
      )}
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? hp(3) : hp(2),
    position: 'relative',
  },
  GarzaLogo: {
    width: isTablet ? wp(40) : wp(60),
    height: isTablet ? hp(12) : hp(15),
    resizeMode: 'contain',
    position: 'absolute',
    top: isTablet ? hp(5) : hp(8),
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: isSmallDevice ? wp(4) : isTablet ? wp(3.5) : wp(5),
    fontWeight: 'bold',
    color: 'white',
    position: 'absolute',
    top: isTablet ? hp(18) : hp(23),
    left: wp(8),
  },
  horaTexto: {
    fontSize: isSmallDevice ? wp(3.5) : isTablet ? wp(3) : wp(4.5),
    fontWeight: 'bold',
    color: '#ffffff',
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp(3) : hp(2),
    right: wp(8),
  },
  menuButton: {
    position: 'absolute',
    top: isTablet ? hp(12) : hp(15),
    right: wp(5),
    backgroundColor: '#a4a2a2',
    padding: isTablet ? wp(1.5) : wp(2.5),
    borderRadius: wp(2),
    zIndex: 200,
  },
  menuIcon: {
    fontSize: isTablet ? wp(5) : wp(7),
    color: '#000',
  },
  menu: {
    position: 'absolute',
    top: isTablet ? hp(20) : hp(25),
    right: wp(2),
    width: isTablet ? wp(25) : wp(35),
    height: isTablet ? hp(45) : hp(50),
    backgroundColor: '#ebd9e2',
    padding: wp(5),
    borderRadius: wp(3),
    elevation: 10,
    zIndex: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuImage: {
    height: isTablet ? hp(6) : hp(8),
    width: '100%',
    resizeMode: 'contain',
    marginBottom: hp(1.5),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0)',
    zIndex: 250,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    marginTop: isTablet ? hp(22) : hp(24),
    paddingHorizontal: wp(3),
  },
  section: {
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: isSmallDevice ? wp(3.5) : isTablet ? wp(3) : wp(4),
    fontWeight: 'bold',
    marginBottom: hp(0.5),
    marginLeft: wp(2),
    color: 'white',
  },
  placeholderItem: {
    width: isTablet ? wp(18) : isSmallDevice ? wp(20) : wp(22),
    height: isTablet ? wp(18) : isSmallDevice ? wp(20) : wp(22),
    backgroundColor: '#ffffff',
    marginRight: wp(3),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: isTablet ? wp(3) : wp(5),
  },
  plusIcon: {
    fontSize: isTablet ? wp(5) : wp(7),
    fontWeight: 'bold',
  },
  imageItem: {
    width: '100%',
    height: '100%',
    borderRadius: isTablet ? wp(3) : wp(5),
    resizeMode: 'cover',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: isTablet ? wp(40) : wp(60),
    padding: wp(5),
    backgroundColor: '#000000',
    borderRadius: wp(3),
    alignItems: 'center',
  },
  modalButton: {
    width: '100%',
    padding: hp(1.5),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  textoModalButton: {
    color: 'white',
    fontSize: isSmallDevice ? wp(4) : isTablet ? wp(3) : wp(4.5),
    fontWeight: '600',
  },
  bottomButton: {
    alignSelf: 'center',
    backgroundColor: '#000000',
    padding: wp(3),
    borderRadius: 100,
    marginTop: hp(4),
    marginBottom: hp(10),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bottomButtonImage: {
    width: isTablet ? wp(20) : wp(30),
    height: isTablet ? wp(10) : wp(15),
    resizeMode: 'contain',
  },
  modalImagenCompleta: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImagenFondo: {
    ...StyleSheet.absoluteFillObject,
  },
  contenedorImagenGrande: {
    width: isTablet ? wp(70) : wp(90),
    height: isTablet ? hp(70) : hp(70),
    borderRadius: wp(5),
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
  },
  imagenGrande: {
    width: '100%',
    height: '100%',
  },
  botonesImagen: {
    position: 'absolute',
    bottom: hp(5),
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: wp(10),
  },
  botonAccion: {
    paddingVertical: hp(2),
    paddingHorizontal: isTablet ? wp(6) : wp(8),
    borderRadius: wp(3),
    minWidth: isTablet ? wp(25) : wp(35),
    alignItems: 'center',
  },
  botonEliminar: {
    backgroundColor: '#ff4444',
  },
  botonCerrar: {
    backgroundColor: '#666',
  },
  textoBoton: {
    color: 'white',
    fontSize: isSmallDevice ? wp(3.5) : isTablet ? wp(2.5) : wp(4),
    fontWeight: 'bold',
  },
  mensajeContainer: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    backgroundColor: '#000000dd',
    paddingVertical: hp(2),
    paddingHorizontal: wp(8),
    borderRadius: wp(3),
    maxWidth: wp(70),
  },
  mensajeTexto: {
    color: 'white',
    fontSize: isSmallDevice ? wp(3.5) : isTablet ? wp(2.5) : wp(4),
    textAlign: 'center',
  },
});