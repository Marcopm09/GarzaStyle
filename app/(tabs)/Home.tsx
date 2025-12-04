import { router } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';
import { useHora } from '../Hora';

const { width, height } = Dimensions.get('window');

// Funciones helper para tamaños responsivos
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
const isSmallDevice = width < 360;
const isMediumDevice = width >= 360 && width < 400;
const isTablet = width >= 768;

export default function HoraLocalScreen() {
  const hora = useHora();
  const [nombreUsuario, setNombreUsuario] = useState<string>('');
  const [imagenesPorSeccion, setImagenesPorSeccion] = useState<{ [key: string]: string[] }>({});
  const usuarioID = 'usuario1';

  const secciones = [
    'Accesorios',
    'Camisas / Playeras',
    'Pantalones / Shorts / Faldas',
    'Tenis / Zapatos',
  ];

  // Cargar nombre del usuario
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

  // Cargar imágenes por sección
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

  // Tamaños adaptables para diferentes dispositivos
  const carouselImageWidth = isTablet ? wp(25) : wp(35);
  const carouselImageHeight = isTablet ? hp(12) : hp(11);

  return (
    <View style={style.container}>
      {/* Logo */}
      <Image 
        source={require('@/assets/images/Logo_GarzaStyle.png')} 
        style={style.GarzaLogo} 
      />

      {/* Nombre de usuario */}
      <Text style={style.subtitle}>¡Bienvenido {nombreUsuario}!</Text>

      {/* Hora */}
      <Text style={style.horaTexto}>{hora}</Text>

      {/* Carrusel de imágenes por sección */}
      <ScrollView 
        style={style.carouselContainer}
        showsVerticalScrollIndicator={false}
      >
        {secciones.map((seccion, idx) => (
          <View key={idx} style={[style.carouselBox, { width: carouselImageWidth }]}>
            <FlatList
              data={imagenesPorSeccion[seccion] && imagenesPorSeccion[seccion].length > 0 
                ? imagenesPorSeccion[seccion] 
                : [null]} // Muestra placeholder si no hay imágenes
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled={false}
              snapToInterval={carouselImageWidth}
              snapToAlignment="start"
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 0 }}
              renderItem={({ item }) =>
                item ? (
                  <Image
                    source={{ uri: item }}
                    style={[
                      style.carouselImageSingle,
                      { width: carouselImageWidth, height: carouselImageHeight }
                    ]}
                  />
                ) : (
                  <View 
                    style={[
                      style.emptyBoxSingle,
                      { width: carouselImageWidth, height: carouselImageHeight }
                    ]}
                  >
                    <Text style={style.emptyText}>Sin imágenes</Text>
                  </View>
                )
              }
              keyExtractor={(item, index) => `${seccion}-${index}`}
            />
          </View>
        ))}
      </ScrollView>

      {/* Menú lateral derecho */}
      <View style={style.menu}>
        <TouchableOpacity 
          onPress={() => router.push('/Armario')}
          activeOpacity={0.7}
        >
          <Image source={require('@/assets/images/Gancho.png')} style={style.menuImage} />
        </TouchableOpacity>
        
        <TouchableOpacity activeOpacity={0.7}>
          <Image source={require('@/assets/images/Camara.png')} style={style.menuImage} />
        </TouchableOpacity>
        
        <TouchableOpacity activeOpacity={0.7}>
          <Image source={require('@/assets/images/Camisa.png')} style={style.menuImage} />
        </TouchableOpacity>
        
        <TouchableOpacity activeOpacity={0.7}>
          <Image source={require('@/assets/images/Pantalon.png')} style={style.menuImage} />
        </TouchableOpacity>
        
        <TouchableOpacity activeOpacity={0.7}>
          <Image source={require('@/assets/images/Guardar.png')} style={style.menuImage} />
        </TouchableOpacity>
      </View>

      {/* Botones de redes sociales abajo */}
      <View style={style.menuRedes}>
        <TouchableOpacity activeOpacity={0.7}>
          <Image source={require('@/assets/images/compartir.png')} style={style.menuImageRedes} />
        </TouchableOpacity>
        
        <TouchableOpacity activeOpacity={0.7}>
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
    top: isSmallDevice ? hp(2) : hp(3),
    left: wp(5),
    position: 'absolute',
    resizeMode: 'contain',
  },
  subtitle: {
    position: 'absolute',
    top: isTablet ? hp(23) : isSmallDevice ? hp(17) : hp(19), // ⬅️ CAMBIO AQUÍ: más separado
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

  // Carrusel de imágenes
  carouselContainer: {
    flex: 1,
    marginRight: wp(2.5),
    marginTop: isTablet ? hp(27) : isSmallDevice ? hp(20) : hp(22), // ⬅️ CAMBIO AQUÍ: más separado
    marginLeft: isTablet ? wp(8) : wp(12),
  },
  carouselBox: {
    marginBottom: hp(1.5),
    overflow: 'hidden',
  },
  carouselImageSingle: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 0,
    resizeMode: 'cover',
  },
  emptyBoxSingle: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    marginRight: 0,
  },
  emptyText: {
    color: '#888',
    fontSize: isSmallDevice ? wp(2.5) : wp(3),
  },

  // Menú lateral derecho
  menu: {
    position: 'absolute',
    top: isTablet ? hp(25) : hp(20),
    right: wp(2.5),
    width: isTablet ? wp(20) : wp(28),
    height: isTablet ? hp(45) : hp(50),
    backgroundColor: '#eee',
    padding: isTablet ? wp(3) : wp(5),
    zIndex: 101,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: -2, height: 0 },
    shadowRadius: 4,
    borderRadius: 10,
  },
  menuImage: {
    height: isTablet ? hp(6) : hp(7.5),
    width: '100%',
    resizeMode: 'contain',
    marginBottom: hp(1.2),
  },

  // Botones de redes sociales
  menuRedes: {
    position: 'absolute',
    bottom: isSmallDevice ? hp(8) : hp(10),
    left: wp(2.5),
    right: isTablet ? wp(25) : wp(32),
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