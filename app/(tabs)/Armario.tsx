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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db, storage } from '../../firebaseConfig';
import { useHora } from '../Hora';

const { width, height } = Dimensions.get('window');

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
  
  // Reemplazar toast por modal simple
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

            <TouchableOpacity>
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
        contentContainerStyle={{ paddingBottom: height * 0.1 }}
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
                  <Text style={{ fontSize: width * 0.07, fontWeight: 'bold' }}>+</Text>
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

      {/* Mensaje simple sin animación */}
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
    backgroundColor: '#000000ff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: height * 0.05,
    position: 'relative',
  },
  GarzaLogo: {
    width: width * 0.6,
    height: height * 0.15,
    resizeMode: 'contain',
    position: 'absolute',
    top: height * 0.08,
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: 'white',
    position: 'absolute',
    top: height * 0.23,
    left: width * 0.08,
  },
  horaTexto: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#ffffffff',
    position: 'absolute',
    top: height * 0.05,
    right: width * 0.08,
  },
  menuButton: {
    position: 'absolute',
    top: height * 0.15,
    right: width * 0.05,
    backgroundColor: '#a4a2a2ff',
    padding: width * 0.025,
    borderRadius: width * 0.02,
    zIndex: 200,
  },
  menuIcon: {
    fontSize: width * 0.07,
    color: '#000',
  },
  menu: {
    position: 'absolute',
    top: height * 0.25,
    right: width * 0.02,
    width: width * 0.35,
    height: height * 0.5,
    backgroundColor: '#ebd9e2ff',
    padding: width * 0.05,
    borderRadius: width * 0.03,
    elevation: 10,
    zIndex: 300,
  },
  menuImage: {
    height: height * 0.08,
    width: '100%',
    resizeMode: 'contain',
    marginBottom: height * 0.015,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0)',
    zIndex: 250,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    marginTop: height * 0.24,
    paddingHorizontal: width * 0.03,
  },
  section: {
    marginBottom: height * 0.02,
  },
  sectionTitle: {
    fontSize: width * 0.04,
    fontWeight: 'bold',
    marginBottom: height * 0.005,
    marginLeft: width * 0.02,
    color: 'white',
  },
  placeholderItem: {
    width: width * 0.22,
    height: width * 0.22,
    backgroundColor: '#ffffffff',
    marginRight: width * 0.03,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: width * 0.05,
  },
  imageItem: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.05,
    resizeMode: 'cover',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    width: width * 0.6,
    padding: width * 0.05,
    backgroundColor: '#000000ff',
    borderRadius: width * 0.03,
    alignItems: 'center',
  },
  modalButton: {
    width: '100%',
    padding: height * 0.015,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  bottomButton: {
    alignSelf: 'center',
    backgroundColor: '#000000ff',
    padding: width * 0.03,
    borderRadius: 100,
    marginTop: height * 0.04,
    marginBottom: height * 0.1,
    elevation: 10,
  },
  bottomButtonImage: {
    width: width * 0.3,
    height: width * 0.15,
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
    width: width * 0.9,
    height: height * 0.9,
    borderRadius: width * 0.05,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333'
  },
  imagenGrande: {
    width: '100%',
    height: '100%',
  },
  botonesImagen: {
    position: 'absolute',
    bottom: height * 0.05,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: width * 0.1,
  },
  botonAccion: {
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.08,
    borderRadius: width * 0.03,
    minWidth: width * 0.35,
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
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  textoModalButton: {
    color: 'white',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  // Nuevo estilo para mensaje simple
  mensajeContainer: {
    position: 'absolute',
    top: '45%',
    left: '15%',
    right: '15%',
    backgroundColor: '#000000dd',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  mensajeTexto: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});