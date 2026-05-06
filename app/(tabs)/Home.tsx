import { router } from 'expo-router';
import { addDoc, collection, doc, getDoc, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { auth } from '../../firebaseConfig';

import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebaseConfig';
import { useClima } from '../Clima';
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
  const translateXAccesorios = useRef(new Animated.Value(-wp(100))).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const [accesoriosVisible, setAccesoriosVisible] = useState(false);
  const hora = useHora();
  const clima = useClima();
  const [nombreUsuario, setNombreUsuario] = useState<string>('');
  const [imagenesPorSeccion, setImagenesPorSeccion] = useState<{ [key: string]: string[] }>({});
  const [imagenesAccesorios, setImagenesAccesorios] = useState<string[]>([]);
  const [accesoriosSeleccionados, setAccesoriosSeleccionados] = useState<string[]>([]);
  const [indicesVisibles, setIndicesVisibles] = useState<{ [key: string]: number }>({
    'Camisas / Playeras': 0,
    'Pantalones / Shorts / Faldas': 0,
    'Tenis / Zapatos': 0,
  });
  const [usuarioID, setUsuarioID] = useState<string>('');
  const [cargandoSugerencia, setCargandoSugerencia] = useState(false);

  // Referencias para los FlatList
  const flatListRefs = useRef<{ [key: string]: FlatList<any> | null }>({});

  const secciones = [
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

  const toggleAccesorios = () => {
    if (accesoriosVisible) {
      Animated.timing(translateXAccesorios, {
        toValue: -wp(100),
        duration: 300,
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        setAccesoriosVisible(false);
      }, 300);
    } else {
      setAccesoriosVisible(true);
      Animated.timing(translateXAccesorios, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const seleccionarAccesorio = (imagen: string) => {
    const indiceExistente = accesoriosSeleccionados.indexOf(imagen);

    if (indiceExistente !== -1) {
      setAccesoriosSeleccionados(prev => prev.filter(item => item !== imagen));
    } else {
      if (accesoriosSeleccionados.length >= 6) {
        Alert.alert('Límite alcanzado', 'Solo puedes seleccionar hasta 6 accesorios');
        return;
      }
      setAccesoriosSeleccionados(prev => [...prev, imagen]);
    }
  };

  const obtenerNumeroAccesorio = (imagen: string): number | null => {
    const indice = accesoriosSeleccionados.indexOf(imagen);
    return indice !== -1 ? indice + 1 : null;
  };

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        setUsuarioID(user.uid);

        const docRef = doc(db, 'Usuarios', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNombreUsuario(docSnap.data().nombre);
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
      }
    };
    cargarUsuario();
  }, []);

  useEffect(() => {
    if (!usuarioID) return;
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

        const qAccesorios = query(
          collection(db, 'Prendas'),
          where('usuarioID', '==', usuarioID),
          where('seccion', '==', 'Accesorios')
        );
        const snapshotAccesorios = await getDocs(qAccesorios);
        const accesorios = snapshotAccesorios.docs.map(doc => doc.data().fotoURL || '');

        setImagenesPorSeccion(nuevasImagenes);
        setImagenesAccesorios(accesorios);
      } catch (error) {
        console.error('Error cargando imágenes:', JSON.stringify(error, null, 2));
      }
    };
    cargarImagenes();
  }, [usuarioID]);

  const containerSize = isTablet ? wp(30) : isSmallDevice ? wp(35) : isMediumDevice ? wp(37) : wp(38);

  const obtenerTamanoImagen = (seccion: string) => {
    if (seccion === 'Camisas / Playeras') {
      return containerSize * 0.70;
    }
    return containerSize;
  };

  const siguienteImagen = (seccion: string) => {
    const imagenes = imagenesPorSeccion[seccion];
    if (!imagenes || imagenes.length === 0) return;

    const indiceActual = indicesVisibles[seccion];
    const nuevoIndice = (indiceActual + 1) % imagenes.length;

    setIndicesVisibles(prev => ({
      ...prev,
      [seccion]: nuevoIndice
    }));

    flatListRefs.current[seccion]?.scrollToIndex({
      index: nuevoIndice,
      animated: true
    });
  };

  const anteriorImagen = (seccion: string) => {
    const imagenes = imagenesPorSeccion[seccion];
    if (!imagenes || imagenes.length === 0) return;

    const indiceActual = indicesVisibles[seccion];
    const nuevoIndice = indiceActual === 0 ? imagenes.length - 1 : indiceActual - 1;

    setIndicesVisibles(prev => ({
      ...prev,
      [seccion]: nuevoIndice
    }));

    flatListRefs.current[seccion]?.scrollToIndex({
      index: nuevoIndice,
      animated: true
    });
  };

  const guardarConjunto = async () => {
    try {
      const prendas: { [key: string]: string | null } = {};

      secciones.forEach((seccion) => {
        const indice = indicesVisibles[seccion];
        const imagenes = imagenesPorSeccion[seccion];

        let nombreCorto = '';
        if (seccion === 'Camisas / Playeras') nombreCorto = 'camisa';
        else if (seccion === 'Pantalones / Shorts / Faldas') nombreCorto = 'pantalon';
        else if (seccion === 'Tenis / Zapatos') nombreCorto = 'zapatos';

        prendas[nombreCorto] = imagenes && imagenes[indice] ? imagenes[indice] : null;
      });

      prendas['accesorios'] = accesoriosSeleccionados.length > 0 ? JSON.stringify(accesoriosSeleccionados) : null;

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

      setAccesoriosSeleccionados([]);
      Alert.alert('¡Éxito!', 'Conjunto guardado correctamente');

    } catch (error) {
      console.error('Error guardando conjunto:', error);
      Alert.alert('Error', 'No se pudo guardar el conjunto');
    }
  };

  // Guarda el último outfit generado para no repetirlo
  const ultimoOutfitRef = useRef<{ camisa: number; pantalon: number; zapatos: number } | null>(null);

  const sugerirOutfit = () => {
    if (cargandoSugerencia) return;

    const sinPrendas = secciones.every(
      s => !imagenesPorSeccion[s] || imagenesPorSeccion[s].length === 0
    );
    if (sinPrendas) {
      Alert.alert('Sin prendas', 'Agrega prendas a tu armario primero');
      return;
    }

    setCargandoSugerencia(true);

    // --- Detectar clima y hora ---
    const climaTexto = (clima || '').toLowerCase();
    const horaTexto  = (hora  || '').toLowerCase();

    let horaNum = 12;
    const matchHora = horaTexto.match(/(\d{1,2}):(\d{2})/);
    if (matchHora) {
      horaNum = parseInt(matchHora[1], 10);
      if (horaTexto.includes('pm') && horaNum !== 12) horaNum += 12;
      if (horaTexto.includes('am') && horaNum === 12) horaNum = 0;
    }

    const esNoche = horaNum >= 19 || horaNum < 6;
    const esFrio  = climaTexto.includes('frío') || climaTexto.includes('frio') ||
                    climaTexto.includes('fresco') || climaTexto.includes('lluv') ||
                    climaTexto.includes('nublado') || climaTexto.includes('viento');

    const totalCamisas    = imagenesPorSeccion['Camisas / Playeras']?.length || 0;
    const totalPantalones = imagenesPorSeccion['Pantalones / Shorts / Faldas']?.length || 0;
    const totalZapatos    = imagenesPorSeccion['Tenis / Zapatos']?.length || 0;

    // --- Elegir índice aleatorio evitando repetir el anterior ---
    const aleatorio = (total: number, anterior: number): number => {
      if (total <= 1) return 0;
      let nuevo = anterior;
      let intentos = 0;
      while (nuevo === anterior && intentos < 10) {
        nuevo = Math.floor(Math.random() * total);
        intentos++;
      }
      return nuevo;
    };

    const ultimo = ultimoOutfitRef.current;
    const indiceCamisa   = aleatorio(totalCamisas,    ultimo?.camisa   ?? -1);
    const indicePantalon = aleatorio(totalPantalones, ultimo?.pantalon ?? -1);
    const indiceZapatos  = aleatorio(totalZapatos,    ultimo?.zapatos  ?? -1);

    // Guardar para la próxima llamada
    ultimoOutfitRef.current = { camisa: indiceCamisa, pantalon: indicePantalon, zapatos: indiceZapatos };

    // --- Accesorios aleatorios (de noche o frío, hasta 2) ---
    const accesoriosSugeridos: string[] = [];
    if (imagenesAccesorios.length > 0 && (esNoche || esFrio)) {
      const indices = Array.from({ length: imagenesAccesorios.length }, (_, i) => i)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      indices.forEach(i => accesoriosSugeridos.push(imagenesAccesorios[i]));
    }

    // --- Aplicar índices con animación ---
    const nuevosIndices: { [key: string]: number } = {};

    const mapeo = [
      { seccion: 'Camisas / Playeras',           indice: indiceCamisa   },
      { seccion: 'Pantalones / Shorts / Faldas', indice: indicePantalon },
      { seccion: 'Tenis / Zapatos',              indice: indiceZapatos  },
    ];

    mapeo.forEach(({ seccion, indice }) => {
      const total = imagenesPorSeccion[seccion]?.length || 0;
      if (total === 0) return;
      const indiceFinal = Math.max(0, Math.min(indice, total - 1));
      nuevosIndices[seccion] = indiceFinal;
      flatListRefs.current[seccion]?.scrollToIndex({ index: indiceFinal, animated: true });
    });

    setIndicesVisibles(prev => ({ ...prev, ...nuevosIndices }));

    if (accesoriosSugeridos.length > 0) {
      setAccesoriosSeleccionados(accesoriosSugeridos);
    }

    // Mensaje según contexto
    let mensaje = '¡Aquí tienes una nueva combinación! ';
    if (esFrio)  mensaje = 'Hace frío hoy, outfit abrigado sugerido. ';
    if (esNoche) mensaje = 'Noche perfecta para este outfit. ';

    setTimeout(() => {
      Alert.alert(' Outfit sugerido', mensaje);
      setCargandoSugerencia(false);
    }, 600); // pequeña pausa para que se vea la animación de scroll
  };

  return (
    <View style={style.container}>
      <StatusBar hidden={true} />

      <Image
        source={require('@/assets/images/Logo_GarzaStyle.png')}
        style={style.GarzaLogo}
      />

      <Text style={style.subtitle}>¡Bienvenido {nombreUsuario}!</Text>
      <Text style={style.horaTexto}>{hora}</Text>
      <Text style={style.climaTexto}>{clima}</Text>

      {/* Pestaña de Accesorios con Badge */}
      <TouchableOpacity
        style={style.pestanaAccesorios}
        onPress={toggleAccesorios}
      >
        <Text style={style.pestanaAccesoriosTexto}>Accesorios</Text>
        {accesoriosSeleccionados.length > 0 && (
          <View style={style.badge}>
            <Text style={style.badgeTexto}>{accesoriosSeleccionados.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Ventana flotante de Accesorios */}
      {accesoriosVisible && (
        <>
          <Pressable
            style={style.overlayAccesorios}
            onPress={toggleAccesorios}
          />
          <Animated.View
            style={[
              style.ventanaAccesorios,
              {
                transform: [{ translateX: translateXAccesorios }]
              }
            ]}
          >
            <View style={style.headerAccesorios}>
              <Text style={style.tituloAccesorios}>
                Accesorios ({accesoriosSeleccionados.length}/6)
              </Text>
              <TouchableOpacity onPress={toggleAccesorios}>
                <Text style={style.cerrarAccesorios}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={style.scrollAccesorios}
              showsVerticalScrollIndicator={false}
            >
              <View style={style.gridAccesorios}>
                {imagenesAccesorios.length > 0 ? (
                  imagenesAccesorios.map((imagen, index) => {
                    const numeroSeleccion = obtenerNumeroAccesorio(imagen);
                    const estaSeleccionado = numeroSeleccion !== null;

                    return (
                      <View key={index} style={style.accesorioItemContainer}>
                        <TouchableOpacity
                          style={[
                            style.accesorioItem,
                            estaSeleccionado && style.accesorioSeleccionado
                          ]}
                          activeOpacity={0.7}
                          onPress={() => seleccionarAccesorio(imagen)}
                        >
                          <Image
                            source={{ uri: imagen }}
                            style={style.accesorioImagen}
                          />
                          {estaSeleccionado && (
                            <View style={style.numeroContainer}>
                              <Text style={style.numeroTexto}>{numeroSeleccion}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })
                ) : (
                  <View style={style.sinAccesorios}>
                    <Text style={style.sinAccesoriosTexto}>
                      No hay accesorios disponibles
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </>
      )}

      <ScrollView
        style={style.carouselContainer}
        contentContainerStyle={style.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {secciones.map((seccion, idx) => {
          const imageSize = obtenerTamanoImagen(seccion);
          const tieneImagenes = imagenesPorSeccion[seccion] && imagenesPorSeccion[seccion].length > 0;

          return (
            <View key={idx} style={style.seccionWrapper}>
              {/* Flecha Izquierda */}
              {tieneImagenes && imagenesPorSeccion[seccion].length > 1 && (
                <TouchableOpacity
                  style={style.flechaIzquierda}
                  onPress={() => anteriorImagen(seccion)}
                >
                  <Image
                    source={require('@/assets/images/Flecha.png')}
                    style={style.flechaImagenIzquierda}
                  />
                </TouchableOpacity>
              )}

              {/* Contenedor de imagen */}
              <View style={[style.outerContainer, { width: containerSize, height: containerSize }]}>
                <FlatList
                  ref={(ref) => {
                    if (ref) {
                      flatListRefs.current[seccion] = ref;
                    }
                  }}
                  data={tieneImagenes ? imagenesPorSeccion[seccion] : [null]}
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
                  onScrollToIndexFailed={(info) => {
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                      flatListRefs.current[seccion]?.scrollToIndex({
                        index: info.index,
                        animated: true
                      });
                    });
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

              {/* Flecha Derecha */}
              {tieneImagenes && imagenesPorSeccion[seccion].length > 1 && (
                <TouchableOpacity
                  style={style.flechaDerecha}
                  onPress={() => siguienteImagen(seccion)}
                >
                  <Image
                    source={require('@/assets/images/Flecha.png')}
                    style={style.flechaImagenDerecha}
                  />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={[style.menuButton, { zIndex: accesoriosVisible ? 50 : 200 }]} onPress={toggleMenu}>
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

            <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')}>
              <Image source={require('@/assets/images/Camara.png')} style={style.menuImage} />
            </TouchableOpacity>

           <TouchableOpacity 
  onPress={() => {
    toggleMenu(); // Cierra el menú antes de navegar
    setTimeout(() => router.push('/(tabs)/RedSocial'), 300);
  }}
>
  <Image 
    source={require('@/assets/images/Camisa.png')} 
    style={style.menuImage} 
  />
</TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/Colorimetria')}>
              <Image source={require('@/assets/images/Pantalon.png')} style={style.menuImage} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/Guardados')}>
              <Image source={require('@/assets/images/Guardar.png')} style={style.menuImage} />
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      )}

      <View style={style.menuRedes}>
        {/* Botón compartir → Sugerir outfit con IA */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={sugerirOutfit}
          disabled={cargandoSugerencia}
        >
          <Image
            source={require('@/assets/images/compartir.png')}
            style={[style.menuImageRedes, cargandoSugerencia && { opacity: 0.4 }]}
          />
        </TouchableOpacity>

        {/* Botón guardar conjunto */}
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
    color: 'rgb(0, 0, 0)',
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp(6) : hp(5),
    right: wp(5),
  },
  pestanaAccesorios: {
    position: 'absolute',
    top: isTablet ? hp(20) : hp(18),
    left: 0,
    backgroundColor: '#d9cba3',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderTopRightRadius: wp(3),
    borderBottomRightRadius: wp(3),
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pestanaAccesoriosTexto: {
    color: '#fff',
    fontSize: isSmallDevice ? wp(3.5) : isTablet ? wp(2.5) : wp(4),
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -hp(0.5),
    right: wp(2),
    backgroundColor: '#FFD700',
    borderRadius: wp(3),
    minWidth: wp(5),
    height: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(1.5),
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeTexto: {
    color: '#000',
    fontSize: isSmallDevice ? wp(2.5) : wp(3),
    fontWeight: 'bold',
  },
  overlayAccesorios: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 98,
  },
  ventanaAccesorios: {
    position: 'absolute',
    top: isTablet ? hp(20) : hp(18),
    left: wp(5),
    width: wp(90),
    backgroundColor: 'rgb(182, 170, 156)',
    paddingVertical: hp(2),
    paddingHorizontal: wp(3),
    maxHeight: isTablet ? hp(60) : hp(65),
    overflow: 'hidden',
    borderRadius: wp(3),
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  headerAccesorios: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(2),
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  tituloAccesorios: {
    fontSize: isSmallDevice ? wp(4.5) : isTablet ? wp(3.5) : wp(5),
    fontWeight: 'bold',
    color: '#fff',
  },
  cerrarAccesorios: {
    fontSize: isTablet ? wp(4) : wp(6),
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollAccesorios: {
    flex: 1,
  },
  gridAccesorios: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp(1),
    paddingTop: hp(1),
  },
  accesorioItemContainer: {
    width: '25%',
    aspectRatio: 1,
    padding: wp(1),
  },
  accesorioItem: {
    flex: 1,
    borderRadius: wp(2),
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
  },
  accesorioSeleccionado: {
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  accesorioImagen: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  numeroContainer: {
    position: 'absolute',
    top: wp(1),
    right: wp(1),
    backgroundColor: '#e76ba7ff',
    borderRadius: wp(3),
    width: wp(6),
    height: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  numeroTexto: {
    color: '#fff',
    fontSize: isSmallDevice ? wp(3) : wp(3.5),
    fontWeight: 'bold',
  },
  sinAccesorios: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  sinAccesoriosTexto: {
    fontSize: isSmallDevice ? wp(3.5) : wp(4),
    color: '#fff',
    textAlign: 'center',
  },
  carouselContainer: {
    flex: 1,
    marginRight: wp(2.5),
    marginTop: isTablet ? hp(25) : isSmallDevice ? hp(25) : hp(18),
    marginLeft: 0,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  seccionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(0.2),
    width: '100%',
  },
  outerContainer: {
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
  flechaIzquierda: {
    marginRight: wp(2),
    width: wp(8),
    height: wp(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  flechaDerecha: {
    marginLeft: wp(2),
    width: wp(8),
    height: wp(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  flechaImagenIzquierda: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    transform: [{ scaleX: -1 }],
  },
  flechaImagenDerecha: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  menuButton: {
    position: 'absolute',
    top: hp(11),
    right: wp(5),
    zIndex: 200,
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
    backgroundColor: '#4e4e4e',
    padding: wp(5),
    zIndex: 201,
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
    zIndex: 202,
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
  climaTexto: {
    fontSize: isSmallDevice ? 11 : isMediumDevice ? 13 : isTablet ? 17 : 15,
    fontWeight: '600',
    color: 'rgb(0, 0, 0)',
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp(9) : hp(8),
    right: wp(5),
  },
});