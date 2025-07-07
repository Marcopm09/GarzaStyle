import { ThemedText } from '@/components/ThemedText';
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
      <View style={styles.container}>
        <Text style={styles.horaTexto}>{hora}</Text>


         <ThemedText style={styles.subtitle}>Bienvenido Marco!</ThemedText>

         
        <Image
          source={require('@/assets/images/Logo_GarzaStyle.png')}
          style={styles.GarzaLogo}
        />
        <Image
          source={require ('@/assets/images/corazon.png')}
          style={styles.corazon}
        />
        <Image 
        source={require('@/assets/images/compartir.png')}
        style={styles.compartir}/>
        <Image source={require('@/assets/images/enviar.png')}
        style={styles.enviar}/>







      </View>

             
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Puedes poner cualquier color: 'black', '#3498db', 'white', etc.
    justifyContent: 'center',
    alignItems: 'center',
  
  },
  horaTexto: {
    fontSize: 18,
    color: '#669339', 
    fontWeight: 'bold', //para hacerlo mas negrita
    position: 'absolute',
    top: 40,
    left: 260,

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
    width:'60%',
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
    resizeMode: 'contain'
  }
});