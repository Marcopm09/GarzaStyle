import { router } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';
import { useHora } from '../Hora';



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

  return (
    <View style={style.container}>
      {/* Logo */}
      <Image source={require('@/assets/images/Logo_GarzaStyle.png')} style={style.GarzaLogo} />

      {/* Nombre de usuario */}
      <Text style={style.subtitle}>¡Bienvenido {nombreUsuario}!</Text>

      {/* Hora */}
      <Text style={style.horaTexto}>{hora}</Text>

{/* Carrusel de imágenes por sección */}
<View style={style.carouselContainer}>
  {secciones.map((seccion, idx) => (
    <View key={idx} style={style.carouselBox}>
      <FlatList
  data={imagenesPorSeccion[seccion]}
  horizontal
  showsHorizontalScrollIndicator={false}
  pagingEnabled={false} // desactivamos pagingEnabled porque snapToInterval hace lo mismo mejor
  snapToInterval={150}  // ancho exacto de la imagen
  snapToAlignment="start"
  decelerationRate="fast"
  contentContainerStyle={{ paddingRight: 0 }} // eliminar espacio extra
  renderItem={({ item }) =>
    item ? (
      <Image
        source={{ uri: item }}
        style={style.carouselImageSingle}
      />
    ) : (
      <View style={style.emptyBoxSingle}>
        <Text style={{ color: '#888', fontSize: 12 }}>Sin imágenes</Text>
      </View>
    )
  }
  keyExtractor={(item, index) => `${seccion}-${index}`}
/>
    </View>
  ))}
</View>



      {/* Menú lateral derecho */}
      <View style={style.menu}>
        <TouchableOpacity onPress={() => router.push('/Armario')}>
          <Image source={require('@/assets/images/Gancho.png')} style={style.menuImage} />
        </TouchableOpacity>
        <Image source={require('@/assets/images/Camara.png')} style={style.menuImage} />
        <TouchableOpacity>
          <Image source={require('@/assets/images/Camisa.png')} style={style.menuImage} />
        </TouchableOpacity>
        <Image source={require('@/assets/images/Pantalon.png')} style={style.menuImage} />
        <Image source={require('@/assets/images/Guardar.png')} style={style.menuImage} />
      </View>

      {/* Botones de redes sociales abajo */}
      <View style={style.menuRedes}>
        <TouchableOpacity>
          <Image source={require('@/assets/images/compartir.png')} style={style.menuImageRedes} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image source={require('@/assets/images/corazon.png')} style={style.menuImageRedes} />
        </TouchableOpacity>
        <TouchableOpacity>
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
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  GarzaLogo: {
    height: 150,
    width: '60%',
    bottom: 630,
    left: 20,
    position: 'absolute',
    resizeMode: 'contain',
  },
  subtitle: {
    position: 'absolute',
    top: 120,
    left: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  horaTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e76ba7ff',
    position: 'absolute',
    top: 40,
    right: 20,
  },

// Carrusel de imágenes
  carouselContainer: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'flex-start',
    marginTop: 120,
    marginLeft: 50, // mueve los contenedores a la derecha
  },
  carouselBox: {
    marginBottom: 8,
    width: 150, // ancho reducido del contenedor
    overflow: 'hidden', // oculta las imágenes que salen del contenedor
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 3,
  },
carouselImageSingle: {
  width: 150,       // ancho completo del contenedor
  height: 90,       // altura reducida
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#ccc',
  marginRight: 0,
  resizeMode: 'cover', // adapta la imagen al contenedor
},

emptyBoxSingle: {
  width: 150,
  height: 90,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#ddd',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#fafafa',
  marginRight: 0,
},
  // Menú lateral derecho
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

  // Botones de redes sociales
  menuRedes: {
    position: 'absolute',
    bottom: 80,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  menuImageRedes: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
});
