import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db, storage } from '../../firebaseConfig';
import { useHora } from '../Hora';

const screenWidth = Dimensions.get('window').width;

export default function HoraLocalScreen() {
useEffect(() => {
  const cargarImagenes = async () => {
    try {
      const secciones = ['Accesorios', 'Camisas / Playeras', 'Pantalones / Shorts / Faldas', 'Tenis / Zapatos'];
      const nuevasImagenes: { [key: string]: string[] } = {};
      
      for (const seccion of secciones) {
        const q = query(
          collection(db, 'Prendas'),
          where('usuarioID', '==', 'usuario1'),
          where('seccion', '==', seccion)
        );
        const snapshot = await getDocs(q);
        nuevasImagenes[seccion] = snapshot.docs.map(doc => doc.data().fotoURL);
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
    const [imagenesPorSeccion, setImagenesPorSeccion] = useState<{[key: string]: string[]}>({
        'Accesorios': [],
        'Camisas / Playeras': [],
        'Pantalones / Shorts / Faldas': [],
        'Tenis / Zapatos': []
    });
    const translateX = useRef(new Animated.Value(screenWidth)).current;

    const toggleMenu = () => {
        if (menuVisible) {
            Animated.timing(translateX, {
                toValue: screenWidth,
                duration: 300,
                useNativeDriver: true,
            }).start(() => { setTimeout(() => { setMenuVisible(false); }, 10); });
        } else {
            setMenuVisible(true);
            Animated.timing(translateX, {
                toValue: screenWidth * 0.4,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };

    // Función para subir imagen y actualizar UI
    const subirImagen = async (usuarioID: string, seccion: string) => {
        try {
            // Permisos de galería
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería para seleccionar imagen.');
                return;
            }

            // Seleccionar imagen
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            const uri = asset.uri;

            // Convertir a blob
            const response = await fetch(uri);
            const blob = await response.blob();

            // Crear referencia Storage
            const timestamp = Date.now();
            const storagePath = `prendas/${usuarioID}/${timestamp}.jpg`;
            const storageRef = ref(storage, storagePath);

            // Subir imagen
            await uploadBytesResumable(storageRef, blob);

            // Obtener URL de descarga
            const downloadURL = await getDownloadURL(storageRef);

            // Guardar en Firestore
            await addDoc(collection(db, 'Prendas'), {
                usuarioID,
                nombre: 'Nombre temporal',
                talla: 'M',
                fotoURL: downloadURL,
                fechaSubida: new Date().toISOString(),
                publica: false,
                seccion
            });

            // Actualizar estado local para mostrar imagen
            setImagenesPorSeccion(prev => ({
                ...prev,
                [seccion]: [...prev[seccion], downloadURL]
            }));

            Alert.alert('✅ Subida exitosa', 'La imagen se ha cargado correctamente.');
        } catch (error) {
            console.error('❌ Error subiendo imagen:', error);
            Alert.alert('Error', 'No se pudo subir la imagen. Revisa la consola.');
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
                <Pressable style={style.overlay} onPress={toggleMenu}>
                    <Animated.View
                        style={[
                            style.menu,
                            {
                                transform: [
                                    {
                                        translateX: translateX.interpolate({
                                            inputRange: [screenWidth * 0.4, screenWidth],
                                            outputRange: [0, screenWidth * 0.6],
                                        }),
                                    },
                                ],
                            },
                        ]}
                        onStartShouldSetResponder={() => true}
                    >
                        <TouchableOpacity onPress={() => router.push('/Home')}>
                            <Image source={require('@/assets/images/House.png')} style={style.menuImage} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => console.log('aun no')}>
                            <Image source={require('@/assets/images/Camara.png')} style={style.menuImage} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => console.log('aun no')}>
                            <Image source={require('@/assets/images/Camisa.png')} style={style.menuImage} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => console.log('aun no')}>
                            <Image source={require('@/assets/images/Pantalon.png')} style={style.menuImage} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => console.log('aun no')}>
                            <Image source={require('@/assets/images/Guardar.png')} style={style.menuImage} />
                        </TouchableOpacity>
                    </Animated.View>
                </Pressable>
            )}

            <Text style={style.horaTexto}>{hora}</Text>
            <Text style={style.subtitle}>TUS GUARDADOS</Text>
            <Text style={style.subtitle2}>LOCAL</Text>
            <Image source={require('@/assets/images/Logo_GarzaStyle.png')} style={style.GarzaLogo} />

            {/* Secciones horizontales */}
            <View style={style.sectionsContainer}>
                {['Accesorios', 'Camisas / Playeras', 'Pantalones / Shorts / Faldas', 'Tenis / Zapatos'].map((title, idx) => (
                    <View key={idx} style={style.section}>
                        <Text style={style.sectionTitle}>{title}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {/* Botón "+" */}
                            <TouchableOpacity
                                style={style.placeholderItem}
                                onPress={() => { setModalVisible(false); subirImagen('usuario1', title); }}
                            >
                                <Text style={{ fontSize: 24, fontWeight: 'bold' }}>+</Text>
                            </TouchableOpacity>

                            {/* Mostrar imágenes subidas */}
                            {imagenesPorSeccion[title].map((uri, index) => (
                                <View key={index} style={style.placeholderItem}>
                                    <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                ))}
            </View>

            {/* Modal flotante */}
            <Modal transparent visible={modalVisible} animationType="fade">
                <Pressable style={style.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={style.modalContent}>
                        <TouchableOpacity
                            style={style.modalButton}
                            onPress={() => { setModalVisible(false); subirImagen('usuario1', 'Camisas / Playeras'); }}
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    subtitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'Black',
        marginBottom: 10,
        position: 'absolute',
        top: 120,
        left: 30,
    },
    subtitle2: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'gray',
        marginBottom: 10,
        position: 'absolute',
        top: 160,
        left: 30,
    },
    //Imagenes
  GarzaLogo: {
    height: 150,
    width: '60%',
    bottom: 630,
    left: 20,
    position: 'absolute',
    resizeMode: 'contain',
  },

    //Para la hora
    horaTexto: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#669339',
        position: 'absolute',
        top: 40,
        left: 260,
    },

    //Para el menu 
    menuButton: {
        position: 'absolute',
        top: 90,
        right: 20,
        zIndex: 100,
        backgroundColor: '#eee',
        padding: 10,
        borderRadius: 5,
    },
    menuIcon: {
        fontSize: 28,
        color: '#000000',
    },
    menu: {
        position: 'absolute',
        top: 160,
        right: 10,
        width: '30%',
        height: '50%',
        backgroundColor: '#eee',
        padding: 20,
        zIndex: 101,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: -2, height: 0 },
        borderRadius: 10,

    },
    menuImage: {
        height: 60,
        width: '100%',
        resizeMode: 'contain',
        marginBottom: 10,

    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0)',
        zIndex: 100,
    },
    //apartados de enmedio
    sectionsContainer: {
        width: '100%',
        paddingHorizontal: 10,
        marginTop: 100, // ajusta este valor hasta que quede debajo de "LOCAL"
    },
     section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        marginLeft: 5,
    },
    placeholderItem: {
        width: 80,
        height: 80,
        backgroundColor: '#eee',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    // apartados modal
      modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    width: 200,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButton: {
    width: '100%',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },

});