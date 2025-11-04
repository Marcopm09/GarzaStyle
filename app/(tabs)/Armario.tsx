import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
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
  useEffect(() => {
    const cargarImagenes = async () => {
      try {
        const secciones = [
          'Accesorios',
          'Camisas / Playeras',
          'Pantalones / Shorts / Faldas',
          'Tenis / Zapatos',
        ];
        const nuevasImagenes: { [key: string]: string[] } = {};

        for (const seccion of secciones) {
          const q = query(
            collection(db, 'Prendas'),
            where('usuarioID', '==', 'usuario1'),
            where('seccion', '==', seccion)
          );
          const snapshot = await getDocs(q);
          nuevasImagenes[seccion] = snapshot.docs.map((doc) => doc.data().fotoURL);
        }

        setImagenesPorSeccion(nuevasImagenes);
      } catch (error) {
        console.error('❌ Error cargando imágenes:', error);
      }
    };

    cargarImagenes();
  }, []);

  const hora = useHora();
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [imagenesPorSeccion, setImagenesPorSeccion] = useState<{ [key: string]: string[] }>({
    Accesorios: [],
    'Camisas / Playeras': [],
    'Pantalones / Shorts / Faldas': [],
    'Tenis / Zapatos': [],
  });
  const translateX = useRef(new Animated.Value(width)).current;

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(translateX, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          setMenuVisible(false);
        }, 10);
      });
    } else {
      setMenuVisible(true);
      Animated.timing(translateX, {
        toValue: width * 0.4,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const subirImagen = async (usuarioID: string, seccion: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería.');
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
      const storageRef = ref(storage, storagePath);

      await uploadBytesResumable(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'Prendas'), {
        usuarioID,
        nombre: 'Nombre temporal',
        talla: 'M',
        fotoURL: downloadURL,
        fechaSubida: new Date().toISOString(),
        publica: false,
        seccion,
      });

      setImagenesPorSeccion((prev) => ({
        ...prev,
        [seccion]: [...prev[seccion], downloadURL],
      }));

      Alert.alert('✅ Subida exitosa', 'La imagen se ha cargado correctamente.');
    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      Alert.alert('Error', 'No se pudo subir la imagen.');
    }
  };

  return (
    <View style={style.container}>
      {/* Botón menú */}
      <TouchableOpacity style={style.menuButton} onPress={toggleMenu}>
        <Text style={style.menuIcon}>☰</Text>
      </TouchableOpacity>

      {/* Menú deslizable */}
      {menuVisible && (
        <>
          <Pressable style={style.overlay} onPress={toggleMenu} />
          <Animated.View
            style={[
              style.menu,
              {
                transform: [
                  {
                    translateX: translateX.interpolate({
                      inputRange: [width * 0.4, width],
                      outputRange: [0, width * 0.6],
                    }),
                  },
                ],
              },
            ]}
          >
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
          </Animated.View>
        </>
      )}

      <Text style={style.horaTexto}>{hora}</Text>
      <Text style={style.subtitle}>TUS GUARDADOS</Text>
      <Text style={style.subtitle2}>LOCAL</Text>
      <Image source={require('@/assets/images/Logo_GarzaStyle.png')} style={style.GarzaLogo} />

      {/* Contenido desplazable */}
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
                    setModalVisible(false);
                    subirImagen('usuario1', title);
                  }}
                >
                  <Text style={{ fontSize: width * 0.07, fontWeight: 'bold' }}>+</Text>
                </TouchableOpacity>

                {imagenesPorSeccion[title].map((uri, index) => (
                  <View key={index} style={style.placeholderItem}>
                    <Image source={{ uri }} style={style.imageItem} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )
        )}

        {/* 🔽 Botón que aparece al final del scroll */}
        <TouchableOpacity style={style.bottomButton}>
          <Image
            source={require('@/assets/images/bolsa.png')}
            style={style.bottomButtonImage}
          />
        </TouchableOpacity>
      </ScrollView>

      {/* Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <Pressable style={style.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={style.modalContent}>
            <TouchableOpacity
              style={style.modalButton}
              onPress={() => {
                setModalVisible(false);
                subirImagen('usuario1', 'Camisas / Playeras');
              }}
            >
              <Text>Galería</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[style.modalButton, { opacity: 0.5 }]}>
              <Text>Cámara</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  subtitle2: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: 'white',
    position: 'absolute',
    top: height * 0.28,
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
    top: height * 0.09,
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
    top: height * 0.18,
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
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    marginTop: height * 0.35,
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
});
