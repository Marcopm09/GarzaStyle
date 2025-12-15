import { router } from 'expo-router';
import { addDoc, collection, doc, getDoc, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebaseConfig';
import { useHora } from '../Hora';

const { width, height } = Dimensions.get('window');
const screenWidth = Dimensions.get('window').width;

const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
const isSmallDevice = width < 360;
const isMediumDevice = width >= 360 && width < 400;
const isTablet = width >= 768;

export default function HoraLocalScreen() {
  const translateX = useRef(new Animated.Value(screenWidth)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const hora = useHora();
  const [nombreUsuario, setNombreUsuario] = useState<string>('');
  const [imagenesPorSeccion, setImagenesPorSeccion] = useState<{ [key: string]: string[] }>({});
  const [indicesVisibles, setIndicesVisibles] = useState<{ [key: string]: number }>({
    'Accesorios': 0,
    'Camisas / Playeras': 0,
    'Pantalones / Shorts / Faldas': 0,
    'Tenis / Zapatos': 0,
  });
  const usuarioID = 'usuario1';

  const secciones = [
    'Accesorios',
    'Camisas / Playeras',
    'Pantalones / Shorts / Faldas',
    'Tenis / Zapatos',
  ];

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(translateX, {
        toValue: screenWidth,
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
        toValue: screenWidth * 0.4,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const docRef = doc(db, 'Usuarios', usuarioID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNombreUsuario(docSnap.data().nombre);
        }
      } catch (error) {
        console.error('Error cargando usuario:', JSON.stringify(error, null, 2));
      }
    };
    cargarUsuario();
  }, []);

  useEffect(() => {
    const cargarImagenes = async () => {
      try {
        const nuevasImagenes: { [key: string]: string[] } = {};
        await Promise.all(
          secciones.map(async (seccion) => {
            const q = query(
              collection(db, 'Prendas'),
              where('usuarioID', '==', usuarioID),
              where('seccion', '==', seccion)
            );
            const snapshot = await getDocs(q);
            nuevasImagenes[seccion] = snapshot.docs.map(doc => doc.data().fotoURL || '');
          })
        );
        setImagenesPorSeccion(nuevasImagenes);
      } catch (error) {
        console.error('Error cargando imágenes:', JSON.stringify(error, null, 2));
      }
    };
    cargarImagenes();
  }, []);

  const containerSize = isTablet ? wp(30) : isSmallDevice ? wp(35) : isMediumDevice ? wp(37) : wp(38);

  const obtenerTamanoImagen = (seccion: string) => {
    if (seccion === 'Camisas / Playeras') {
      return containerSize * 0.70;
    }
    return containerSize;
  };

  const guardarConjunto = async () => {
    try {
      const prendas: { [key: string]: string | null } = {};
      
      secciones.forEach((seccion) => {
        const indice = indicesVisibles[seccion];
        const imagenes = imagenesPorSeccion[seccion];
        
        let nombreCorto = '';
        if (seccion === 'Accesorios') nombreCorto = 'accesorios';
        else if (seccion === 'Camisas / Playeras') nombreCorto = 'camisa';
        else if (seccion === 'Pantalones / Shorts / Faldas') nombreCorto = 'pantalon';
        else if (seccion === 'Tenis / Zapatos') nombreCorto = 'zapatos';
        
        prendas[nombreCorto] = imagenes && imagenes[indice] ? imagenes[indice] : null;
      });

      const tienePrendas = Object.values(prendas).some(url => url !== null);
      
      if (!tienePrendas) {
        Alert.alert('Error', 'No hay prendas para guardar');
        return;
      }

      await addDoc(collection(db, 'Conjuntos'), {
        usuarioID: usuarioID,
        fecha: Timestamp.now(),
        prendas: prendas,
        nombre: 'Sin nombre',
      });

      Alert.alert('¡Éxito!', 'Conjunto guardado correctamente');
      
    } catch (error) {
      console.error('Error guardando conjunto:', error);
      Alert.alert('Error', 'No se pudo guardar el conjunto');
    }
  };

  return (
    <View style={style.container}>
      <Image 
        source={require('@/assets/images/Logo_GarzaStyle.png')} 
        style={style.GarzaLogo} 
      />

      <Text style={style.subtitle}>¡Bienvenido {nombreUsuario}!</Text>
      <Text style={style.horaTexto}>{hora}</Text>

      <ScrollView 
        style={style.carouselContainer}
        showsVerticalScrollIndicator={false}
      >
        {secciones.map((seccion, idx) => {
          const imageSize = obtenerTamanoImagen(seccion);
          
          return (
            <View key={idx} style={[style.outerContainer, { width: containerSize, height: containerSize }]}>
              <FlatList
                data={imagenesPorSeccion[seccion] && imagenesPorSeccion[seccion].length > 0 
                  ? imagenesPorSeccion[seccion] 
                  : [null]}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled={false}
                snapToInterval={containerSize}
                snapToAlignment="start"
                decelerationRate="fast"
                contentContainerStyle={{ paddingRight: 0 }}
                onMomentumScrollEnd={(event) => {
                  const scrollPosition = event.nativeEvent.contentOffset.x;
                  const index = Math.round(scrollPosition / containerSize);
                  setIndicesVisibles(prev => ({
                    ...prev,
                    [seccion]: index
                  }));
                }}
                renderItem={({ item }) =>
                  item ? (
                    <View style={[style.innerContainer, { width: containerSize, height: containerSize }]}>
                      <Image
                        source={{ uri: item }}
                        style={[
                          style.carouselImageSingle,
                          { 
                            width: imageSize,
                            height: imageSize
                          }
                        ]}
                      />
                    </View>
                  ) : (
                    <View 
                      style={[
                        style.emptyBoxSingle,
                        { 
                          width: containerSize,
                          height: containerSize
                        }
                      ]}
                    >
                      <Text style={style.emptyText}>Sin imágenes</Text>
                    </View>
                  )
                }
                keyExtractor={(item, index) => `${seccion}-${index}`}
              />
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={style.menuButton} onPress={toggleMenu}>
        <Text style={style.menuIcon}>☰</Text>
      </TouchableOpacity>

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
            <TouchableOpacity onPress={() => router.push('/Armario')}>
              <Image source={require('@/assets/images/Gancho.png')} style={style.menuImage} />
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

            <TouchableOpacity onPress={() => router.push('/Guardados')}>
              <Image source={require('@/assets/images/Guardar.png')} style={style.menuImage} />
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      )}

      <View style={style.menuRedes}>
        <TouchableOpacity activeOpacity={0.7}>
          <Image source={require('@/assets/images/compartir.png')} style={style.menuImageRedes} />
        </TouchableOpacity>
        
        <TouchableOpacity activeOpacity={0.7} onPress={guardarConjunto}>
          <Image source={require('@/assets/images/corazon.png')} style={style.menuImageRedes} />
        </TouchableOpacity>
        
        <TouchableOpacity activeOpacity={0.7}>
          <Image source={require('@/assets/images/enviar.png')} style={style.menuImageRedes} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? hp(6) : hp(5),
    paddingHorizontal: wp(2.5),
  },
  GarzaLogo: {
    height: isTablet ? hp(15) : hp(18),
    width: isTablet ? wp(40) : wp(60),
    top: isTablet ? hp(-2) : isSmallDevice ? hp(-1) : hp(-2),
    left: wp(5),
    position: 'absolute',
    resizeMode: 'contain',
  },
  subtitle: {
    position: 'absolute',
    top: isTablet ? hp(15) : isSmallDevice ? hp(13) : hp(11),
    left: wp(5),
    fontSize: isSmallDevice ? 14 : isMediumDevice ? 16 : isTablet ? 22 : 18,
    fontWeight: 'bold',
    color: 'black',
  },
  horaTexto: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 14 : isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#e76ba7ff',
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp(6) : hp(5),
    right: wp(5),
  },
  carouselContainer: {
    flex: 1,
    marginRight: wp(2.5),
    marginTop: isTablet ? hp(20) : isSmallDevice ? hp(20) : hp(10),
    marginLeft: isTablet ? wp(25) : wp(30),
  },
  outerContainer: {
    marginBottom: hp(0.2),
    borderRadius: 8,
    borderWidth: 0.3,
    borderColor: '#ccc',
    overflow: 'hidden',
  },
  innerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImageSingle: {
    borderRadius: 8,
    resizeMode: 'cover',
    overflow: 'hidden',
  },
  emptyBoxSingle: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  emptyText: {
    color: '#888',
    fontSize: isSmallDevice ? wp(2.5) : wp(3),
  },
  menuButton: {
    position: 'absolute',
    top: hp(11),
    right: wp(5),
    zIndex: 100,
    backgroundColor: '#eee',
    padding: wp(2.5),
    borderRadius: wp(1.5),
  },
  menuIcon: {
    fontSize: wp(7),
    color: '#000000',
  },
  menu: {
    position: 'absolute',
    top: hp(20),
    right: wp(2.5),
    width: wp(30),
    height: hp(50),
    backgroundColor: '#eee',
    padding: wp(5),
    zIndex: 101,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: -2, height: 0 },
    borderRadius: wp(2.5),
  },
  menuImage: {
    height: hp(7.5),
    width: '100%',
    resizeMode: 'contain',
    marginBottom: hp(1.2),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0)',
    zIndex: 100,
  },
  menuRedes: {
    position: 'absolute',
    bottom: isSmallDevice ? hp(8) : hp(7),
    left: wp(2.5),
    right: isTablet ? wp(25) : wp(5),
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  menuImageRedes: {
    width: isSmallDevice ? wp(14) : isTablet ? wp(12) : wp(17),
    height: isSmallDevice ? wp(14) : isTablet ? wp(12) : wp(17),
    resizeMode: 'contain',
  },
});