
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function HoraLocalScreen() {
    const [hora, setHora] = useState('');
  
    useEffect(() => {
      const interval = setInterval(() => {
        const newHora = new Date().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        });
  
        setHora(newHora);  // Actualiza la hora
      }, 1000);  // Actualiza cada segundo
  
      return () => clearInterval(interval);  // Limpia el intervalo cuando se desmonta
    }, []);

  return (
    <View style={style.container}>
      <Text style={style.horaTexto}>{hora}</Text>
      <Text style={style.subtitle}>¡Bienvenido Marco!</Text>
      <Image
        source={require('@/assets/images/Logo_GarzaStyle.png')}
        style={style.GarzaLogo}
      />
        <Image
        source={require('@/assets/images/corazon.png')}
        style={style.corazon}
      />
        <Image
        source={require('@/assets/images/compartir.png')}
        style={style.compartir}
      />
        <Image
        source={require('@/assets/images/enviar.png')}
        style={style.enviar}
      />
    </View>
  );
}


const style = StyleSheet.create({
    container:{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    subtitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#669339',
        marginBottom: 10,
        position: 'absolute',
        top: 120,
        left: 30,
    },
    GarzaLogo: {
        height: 150,
        width: '60%',
        bottom: 530,
        left: 20,
        position: 'absolute',
        resizeMode: 'contain',
      },
    corazon: {
        height: 90,
        width: '60%',
        bottom: 10,
        left: -50,
        position: 'absolute',
        resizeMode: 'contain',
      },

    compartir: {
        height: 90,
        width: '60%',
        bottom: 10,
        left: 70,
        position: 'absolute',
        resizeMode: 'contain',
      },
    enviar: {
        height: 90,
        width: '60%',
        bottom: 10,
        left: 200,
        position: 'absolute',
        resizeMode: 'contain',
      },
    horaTexto: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#669339', 
        position: 'absolute',
        top:40,  
        left: 260,
    },

});