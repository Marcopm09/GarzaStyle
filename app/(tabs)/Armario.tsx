import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useHora } from '../Hora';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default function HoraLocalScreen() {
  const hora = useHora();
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const translateX = useRef(new Animated.Value(screenWidth)).current;

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(translateX, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setTimeout(() => setMenuVisible(false), 10));
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
      {/* ☰ Botón menú */}
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

            <TouchableOpacity onPress={() => console.log('aun no')}>
              <Image
                source={require('@/assets/images/Guardar.png')}
                style={style.menuImage}
              />
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      )}

      {/* Hora arriba */}
      <Text style={style.horaTexto}>{hora}</Text>

      {/* Logo y títulos */}
      <View style={style.headerContainer}>
        <Image
          source={require('@/assets/images/Logo_GarzaStyle.png')}
          style={style.GarzaLogo}
        />
        <Text style={style.subtitle}>GLOBALES</Text>
      </View>

      {/* Secciones horizontales */}
      <View style={style.sectionsContainer}>
        {['Accesorios', 'Camisas / Playeras', 'Pantalones / Shorts / Faldas', 'Tenis / Zapatos'].map((title, idx) => (
          <View key={idx} style={style.section}>
            <Text style={style.sectionTitle}>{title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={style.placeholderItem}
                onPress={() => setModalVisible(true)}>
                <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#ec407a' }}>+</Text>
              </TouchableOpacity>
              {[2, 3].map((i) => (
                <View key={i} style={style.placeholderItem}>
                  <Text style={{ color: '#ad1457' }}>Item {i}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ))}
      </View>

      {/* Modal para "+" */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <Pressable style={style.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={style.modalContent}>
            <TouchableOpacity style={style.modalButton}>
              <Text style={style.modalText}>Galería</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[style.modalButton, { opacity: 0.5 }]}>
              <Text style={style.modalText}>Cámara</Text>
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
    alignItems: 'center',
    backgroundColor: '#000000ff',
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: screenHeight * 0.08,
  },
  GarzaLogo: {
    width: screenWidth * 0.6,
    height: undefined,
    aspectRatio: 2,
    resizeMode: 'contain',
  },
  subtitle: {
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
    color: '#ffffffff',
    marginTop: screenHeight * 0.015,
  },
  horaTexto: {
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
    color: '#ffffffff',
    position: 'absolute',
    top: screenHeight * 0.05,
    right: screenWidth * 0.1,
  },
  menuButton: {
    position: 'absolute',
    top: screenHeight * 0.05,
    left: screenWidth * 0.05,
    zIndex: 100,
    backgroundColor: '#000000ff',
    padding: screenWidth * 0.02,
    borderRadius: 8,
    shadowColor: '#ad1457',
    shadowOpacity: 0.4,
    shadowOffset: { width: 1, height: 2 },
  },
  menuIcon: {
    fontSize: screenWidth * 0.07,
    color: '#ffffffff',
  },
  menu: {
    position: 'absolute',
    top: screenHeight * 0.2,
    right: screenWidth * 0.02,
    width: '30%',
    height: '50%',
    backgroundColor: '#ffffffff',
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#3a3638ff',
    shadowOpacity: 0.3,
    shadowOffset: { width: -2, height: 0 },
  },
  menuImage: {
    height: screenWidth * 0.15,
    width: '100%',
    resizeMode: 'contain',
    marginBottom: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0)',
    zIndex: 100,
  },
  sectionsContainer: {
    width: '100%',
    paddingHorizontal: screenWidth * 0.03,
    marginTop: screenHeight * 0.03,
  },
  section: {
    marginBottom: screenHeight * 0.02,
  },
  sectionTitle: {
    fontSize: screenWidth * 0.04,
    fontWeight: 'bold',
    color: '#fe8cc3',
    marginBottom: 5,
    marginLeft: 5,
  },
  placeholderItem: {
    width: screenWidth * 0.22,
    height: screenWidth * 0.22,
    backgroundColor: '#ffffffff',
    marginRight: screenWidth * 0.03,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    width: screenWidth * 0.6,
    padding: 20,
    backgroundColor: '#ffffffff',
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000000ff',
    shadowOpacity: 0.4,
    shadowOffset: { width: 2, height: 4 },
  },
  modalButton: {
    width: '100%',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#0000',
  },
  modalText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

