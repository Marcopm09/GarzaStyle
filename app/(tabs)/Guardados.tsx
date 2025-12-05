
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Dimensions, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHora } from '../Hora';


const screenWidth = Dimensions.get('window').width;
const { width, height } = Dimensions.get('window');


export default function HoraLocalScreen() {
    const hora = useHora();
    const [menuVisible, setMenuVisible] = useState(false);
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
                            <Image
                                source={require('@/assets/images/House.png')}
                                style={style.menuImage}
                            /></TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => console.log('aun no')}>
                            <Image
                                source={require('@/assets/images/Gancho.png')}
                                style={style.menuImage}
                            /></TouchableOpacity>

                        <TouchableOpacity onPress={() => console.log('aun no')}>
                            <Image
                                source={require('@/assets/images/Camara.png')}
                                style={style.menuImage}
                            /></TouchableOpacity>

                        <TouchableOpacity onPress={() => console.log('aun no')}>
                            <Image
                                source={require('@/assets/images/Camisa.png')}
                                style={style.menuImage}
                            /></TouchableOpacity>

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
        </View>
    );
}


const style = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000ff',
    },
    subtitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
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

    //Para la hora
    horaTexto: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e76ba7ff',
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
    top: height * 0.25,
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


});