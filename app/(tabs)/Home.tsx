
import { router, } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHora } from '../Hora';


const screenWidth = Dimensions.get('window').width;

export default function HoraLocalScreen() {
  const hora = useHora(); 
  const [menuVisible, setMenuVisible] = useState(false);
  
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const usuarioID = 'usuario1'; // o dinámico según tu auth
        const docRef = doc(db, 'Usuarios', usuarioID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNombreUsuario(docSnap.data().nombre); // nombre del usuario
        } else {
          console.log('No se encontró el usuario');
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
      }
    };

    cargarUsuario();
  }, []);

  return (
    <View style={style.container}>
      {/* Menú deslizable */}
<View style={style.menu}>
  <TouchableOpacity onPress={()=> router.push('/Armario')}>
  <Image source={require('@/assets/images/Gancho.png')} style={style.menuImage} />
  </TouchableOpacity>
  <Image source={require('@/assets/images/Camara.png')} style={style.menuImage} />
  <TouchableOpacity onPress={()=> console.log('Funciona')}>
  <Image source={require('@/assets/images/Camisa.png')} style={style.menuImage} />
  </TouchableOpacity>
  <Image source={require('@/assets/images/Pantalon.png')} style={style.menuImage} />
  <Image source={require('@/assets/images/Guardar.png')} style={style.menuImage} />
  
  
</View>

      <Text style={style.horaTexto}>{hora}</Text>
      <Text style={style.subtitle}>¡Bienvenido {nombreUsuario}!</Text>
      <Image source={require('@/assets/images/Logo_GarzaStyle.png')} style={style.GarzaLogo} />

      <View style={style.menuRedes}>
        <TouchableOpacity onPress={() => console.log('hola')}>
          <Image source={require('@/assets/images/compartir.png')} style={style.menuImageRedes} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('hola')}>
          <Image source={require('@/assets/images/corazon.png')} style={style.menuImageRedes} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('holi')}>
          <Image source={require('@/assets/images/enviar.png')} style={style.menuImageRedes} />
        </TouchableOpacity>
      </View>
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
  //Imagenes
  GarzaLogo: {
    height: 150,
    width: '60%',
    bottom: 630,
    left: 20,
    position: 'absolute',
    resizeMode: 'contain',
  },
  menuRedes: {
  position: 'absolute',
  top: 600,
  right: 4, // o left: 10 si quieres que esté al lado izquierdo
  width: '98%',
  height: '15%',
  backgroundColor: '#ffffffff',
  padding: 20,
  zIndex: 101,
  elevation: 0,
  shadowColor: 'transparent',
  shadowOpacity: 0,
  shadowOffset: { width: 0, height: 0 },
  borderRadius: 10,
  flexDirection:'row',
  justifyContent: 'space-around', //sdepara los icones de froma uniforme 
  
},
menuImageRedes: {
  height: 75,
  width: 75,
  resizeMode: 'contain',
},

  //Para la hora
horaTexto: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#669339',
  position: 'absolute',
  top: 40,
  right: 20, // usa 'right' en lugar de 'left' si quieres que se alinee a la derecha
},




  //Para el menu 

menu: {
  position: 'absolute',
  top: 160,
  right: 10, // o left: 10 si quieres que esté al lado izquierdo
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

});