import { router } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebaseConfig';
import { useHora } from '../Hora';

const screenWidth = Dimensions.get('window').width;
const { width, height } = Dimensions.get('window');

const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

// Detección de tamaño de dispositivo
const isSmallDevice = width < 360;
const isMediumDevice = width >= 360 && width < 400;
const isTablet = width >= 768;

interface Conjunto {
  id: string;
  prendas: {
    accesorios: string | null;
    camisa: string | null;
    pantalon: string | null;
    zapatos: string | null;
  };
  fecha: any;
  nombre?: string;
}

export default function GuardadosScreen() {
  const hora = useHora();
  const [menuVisible, setMenuVisible] = useState(false);
  const translateX = useRef(new Animated.Value(screenWidth)).current;
  const [conjuntos, setConjuntos] = useState<Conjunto[]>([]);
  const [nombreUsuario, setNombreUsuario] = useState<string>('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const usuarioID = 'usuario1';

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
    cargarUsuario();
    cargarConjuntos();
  }, []);

  const cargarUsuario = async () => {
    try {
      const docRef = doc(db, 'Usuarios', usuarioID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setNombreUsuario(docSnap.data().nombre);
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  };

  const cargarConjuntos = async () => {
    try {
      const q = query(
        collection(db, 'Conjuntos'),
        where('usuarioID', '==', usuarioID)
      );
      const snapshot = await getDocs(q);
      const conjuntosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conjunto[];
      
      // Ordenar por fecha más reciente
      conjuntosData.sort((a, b) => b.fecha.seconds - a.fecha.seconds);
      
      setConjuntos(conjuntosData);
    } catch (error) {
      console.error('Error cargando conjuntos:', error);
      Alert.alert('Error', 'No se pudieron cargar los conjuntos guardados');
    }
  };

  const actualizarNombreConjunto = async (id: string, nuevoNombre: string) => {
    try {
      const docRef = doc(db, 'Conjuntos', id);
      await updateDoc(docRef, {
        nombre: nuevoNombre
      });
      
      // Actualizar estado local
      setConjuntos(prev => 
        prev.map(conjunto => 
          conjunto.id === id 
            ? { ...conjunto, nombre: nuevoNombre }
            : conjunto
        )
      );
      
      setEditandoId(null);
    } catch (error) {
      console.error('Error actualizando nombre:', error);
      Alert.alert('Error', 'No se pudo actualizar el nombre');
    }
  };

  const eliminarConjunto = async (id: string) => {
    Alert.alert(
      'Eliminar conjunto',
      '¿Estás seguro de que quieres eliminar este conjunto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'Conjuntos', id));
              setConjuntos(prev => prev.filter(c => c.id !== id));
              Alert.alert('Éxito', 'Conjunto eliminado correctamente');
            } catch (error) {
              console.error('Error eliminando conjunto:', error);
              Alert.alert('Error', 'No se pudo eliminar el conjunto');
            }
          }
        }
      ]
    );
  };

  const compartirConjunto = (id: string) => {
    Alert.alert('Compartir', 'Funcionalidad de compartir próximamente');
  };

  return (
    <View style={style.container}>
      <StatusBar hidden={true} />
      
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
            <TouchableOpacity 
              onPress={() => {
                toggleMenu();
                setTimeout(() => router.push('/Home'), 300);
              }}
            >
              <Image
                source={require('@/assets/images/House.png')}
                style={style.menuImage}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => {
                toggleMenu();
                setTimeout(() => router.push('/Armario'), 300);
              }}
            >
              <Image
                source={require('@/assets/images/Gancho.png')}
                style={style.menuImage}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => console.log('aun no')}>
              <Image
                source={require('@/assets/images/Camara.png')}
                style={style.menuImage}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => console.log('aun no')}>
              <Image
                source={require('@/assets/images/Camisa.png')}
                style={style.menuImage}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => console.log('aun no')}>
              <Image
                source={require('@/assets/images/Pantalon.png')}
                style={style.menuImage}
              />
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      )}

      <Text style={style.horaTexto}>{hora}</Text>
      <Text style={style.subtitle}>TUS GUARDADOS</Text>
      <Image
        source={require('@/assets/images/Logo_GarzaStyle.png')}
        style={style.GarzaLogo}
      />

      {/* ScrollView para permitir scroll completo */}
      <ScrollView 
        style={style.scrollContainer}
        contentContainerStyle={style.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {conjuntos.length > 0 ? (
          <View style={style.gridContainer}>
            {conjuntos.map((item) => (
              <View key={item.id} style={style.conjuntoCard}>
                {/* Encabezado con nombre de usuario, conjunto y fecha */}
                <View style={style.headerContainer}>
                  <View style={style.headerLeft}>
                    <Text style={style.nombreUsuarioText}>{nombreUsuario}</Text>
                    
                    {editandoId === item.id ? (
                      <TextInput
                        style={style.nombreConjuntoInput}
                        value={item.nombre || ''}
                        placeholder="Sin Nombre"
                        placeholderTextColor="#ccc"
                        onChangeText={(text) => {
                          if (text.length <= 25) {
                            setConjuntos(prev =>
                              prev.map(c =>
                                c.id === item.id ? { ...c, nombre: text } : c
                              )
                            );
                          }
                        }}
                        onBlur={() => {
                          const nombreFinal = item.nombre && item.nombre.trim() !== '' 
                            ? item.nombre 
                            : 'Sin Nombre';
                          actualizarNombreConjunto(item.id, nombreFinal);
                        }}
                        autoFocus
                        selectTextOnFocus
                        maxLength={25}
                      />
                    ) : (
                      <TouchableOpacity onPress={() => setEditandoId(item.id)}>
                        <Text style={style.nombreConjuntoText}>
                          {item.nombre || 'Sin Nombre'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={style.headerRight}>
                    <Text style={style.fechaText}>
                      {new Date(item.fecha.seconds * 1000).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>

                {/* Contenedor de las 4 prendas en VERTICAL */}
                <View style={style.prendasContainer}>
                  {/* Accesorios */}
                  <View style={style.prendaBox}>
                    {item.prendas.accesorios ? (
                      <Image 
                        source={{ uri: item.prendas.accesorios }} 
                        style={style.prendaImage}
                      />
                    ) : (
                      <View style={style.emptyBox}>
                        <Text style={style.emptyText}>-</Text>
                      </View>
                    )}
                  </View>

                  {/* Camisa */}
                  <View style={style.prendaBox}>
                    {item.prendas.camisa ? (
                      <Image 
                        source={{ uri: item.prendas.camisa }} 
                        style={style.prendaImage}
                      />
                    ) : (
                      <View style={style.emptyBox}>
                        <Text style={style.emptyText}>-</Text>
                      </View>
                    )}
                  </View>

                  {/* Pantalón */}
                  <View style={style.prendaBox}>
                    {item.prendas.pantalon ? (
                      <Image 
                        source={{ uri: item.prendas.pantalon }} 
                        style={style.prendaImage}
                      />
                    ) : (
                      <View style={style.emptyBox}>
                        <Text style={style.emptyText}>-</Text>
                      </View>
                    )}
                  </View>

                  {/* Zapatos */}
                  <View style={style.prendaBox}>
                    {item.prendas.zapatos ? (
                      <Image 
                        source={{ uri: item.prendas.zapatos }} 
                        style={style.prendaImage}
                      />
                    ) : (
                      <View style={style.emptyBox}>
                        <Text style={style.emptyText}>-</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Botones de acción */}
                <View style={style.botonesAccion}>
                  <TouchableOpacity 
                    style={style.deleteButtonContainer}
                    onPress={() => eliminarConjunto(item.id)}
                  >
                    <Image 
                      source={require('@/assets/images/Borrar.png')} 
                      style={style.deleteButton} 
                    />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={style.shareButtonContainer}
                    onPress={() => compartirConjunto(item.id)}
                  >
                    <Image 
                      source={require('@/assets/images/compa.png')} 
                      style={style.shareButton} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={style.emptyContainer}>
            <Text style={style.emptyListText}>No tienes conjuntos guardados</Text>
            <Text style={style.emptyListSubtext}>Guarda tus outfits favoritos desde el Home</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  subtitle: {
    fontSize: isSmallDevice ? wp(4.5) : isTablet ? wp(3.5) : wp(5),
    fontWeight: 'bold',
    color: '#ffffff',
    position: 'absolute',
    top: isTablet ? hp(16) : hp(15),
    left: wp(8),
  },
  GarzaLogo: {
    height: isTablet ? hp(12) : hp(18),
    width: isTablet ? wp(40) : wp(60),
    top: isTablet ? hp(1) : hp(-1),
    left: wp(5),
    position: 'absolute',
    resizeMode: 'contain',
  },
  horaTexto: {
    fontSize: isSmallDevice ? wp(4) : isTablet ? wp(3) : wp(4.5),
    fontWeight: 'bold',
    color: '#e76ba7ff',
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp(6) : hp(5),
    right: wp(8),
  },
  menuButton: {
    position: 'absolute',
    top: isTablet ? hp(12) : hp(11),
    right: wp(5),
    zIndex: 100,
    backgroundColor: '#eee',
    padding: isTablet ? wp(1.5) : wp(2.5),
    borderRadius: wp(1.5),
  },
  menuIcon: {
    fontSize: isTablet ? wp(5) : wp(7),
    color: '#000000',
  },
  menu: {
    position: 'absolute',
    top: hp(20),
    right: wp(2),
    width: isTablet ? wp(25) : wp(35),
    height: isTablet ? hp(45) : hp(50),
    backgroundColor: '#ebd9e2',
    padding: wp(5),
    borderRadius: wp(3),
    elevation: 10,
    zIndex: 300,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
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
    zIndex: 200,
  },
  scrollContainer: {
    flex: 1,
    marginTop: isTablet ? hp(20) : hp(22),
  },
  scrollContent: {
    paddingBottom: hp(5),
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: wp(2),
  },
  conjuntoCard: {
    backgroundColor: '#ffffff',
    borderRadius: wp(4),
    padding: wp(3),
    margin: wp(2.5),
    width: isTablet ? wp(70) : wp(85),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: hp(1.5),
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  nombreUsuarioText: {
    fontSize: isSmallDevice ? wp(3.8) : isTablet ? wp(2.5) : wp(4),
    color: '#000000',
    fontWeight: '500',
    marginBottom: hp(0.3),
  },
  nombreConjuntoText: {
    fontSize: isSmallDevice ? wp(2.5) : isTablet ? wp(1.8) : wp(2.8),
    color: '#fe8cc3',
    fontWeight: 'bold',
  },
  nombreConjuntoInput: {
    fontSize: isSmallDevice ? wp(2.5) : isTablet ? wp(1.8) : wp(2.8),
    color: '#000',
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#e76ba7ff',
    paddingVertical: hp(0.3),
  },
  fechaText: {
    fontSize: isSmallDevice ? wp(2.8) : isTablet ? wp(2) : wp(3),
    color: '#999',
    fontWeight: '500',
    textAlign: 'right',
  },
  prendasContainer: {
    flexDirection: 'column',
    gap: hp(0.8),
  },
  prendaBox: {
    width: '100%',
    height: hp(8),
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  prendaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  emptyBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  emptyText: {
    color: '#ccc',
    fontSize: isTablet ? wp(3) : wp(4.5),
    fontWeight: 'bold',
  },
  botonesAccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(2),
    paddingHorizontal: wp(2),
  },
  deleteButtonContainer: {
    padding: wp(2),
  },
  deleteButton: {
    width: isTablet ? wp(8) : wp(12),
    height: isTablet ? wp(8) : wp(12),
    resizeMode: 'contain',
  },
  shareButtonContainer: {
    padding: wp(2),
  },
  shareButton: {
    width: isTablet ? wp(8) : wp(13),
    height: isTablet ? wp(8) : wp(13),
    resizeMode: 'contain',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(10),
    paddingHorizontal: wp(10),
  },
  emptyListText: {
    color: '#ffffff',
    fontSize: isSmallDevice ? wp(4.5) : isTablet ? wp(3) : wp(5),
    fontWeight: 'bold',
    marginBottom: hp(1),
    textAlign: 'center',
  },
  emptyListSubtext: {
    color: '#999',
    fontSize: isSmallDevice ? wp(3.5) : isTablet ? wp(2.5) : wp(3.8),
    textAlign: 'center',
  },
});