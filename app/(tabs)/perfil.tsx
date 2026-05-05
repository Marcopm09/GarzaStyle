

import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
    Alert, Dimensions,
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
import { auth, db, storage } from '../../firebaseConfig';
import { useClima } from '../Clima';
import { useHora } from '../Hora';

const { width, height } = Dimensions.get('window');
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;
const isSmallDevice = width < 360;
const isTablet = width >= 768;

export default function PerfilScreen() {
    const hora = useHora();
    const climar = useClima();

    const [menuVisible, setMenuVisible] = useState(false);
    const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

    // Estos valores vendrían del cuestionario / Firestore
    const [nombre, setNombre] = useState('');
    const [estatura, setEstatura] = useState('');
    const [genero, setGenero] = useState('');
    const [peso, setPeso] = useState('');
    const [estilo, setEstilo] = useState('');
    const [clima, setClima] = useState('');

    useEffect(() => {
        const cargarPerfil = async () => {
            const user = auth.currentUser;
            if (!user) return;
            const docSnap = await getDoc(doc(db, 'Usuarios', user.uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                setNombre(data.nombre || '');
                setEstatura(data.estatura || '');
                setGenero(data.genero || '');
                setPeso(data.peso || '');
                setEstilo(data.estilo || '');
                setClima(data.clima || '');
                setFotoPerfil(data.urlImagenPerfil || null);
            }
        };
        cargarPerfil();
    }, []);

    // Función para guardar cambios del perfil
    const guardarCambios = async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
            await updateDoc(doc(db, 'Usuarios', user.uid), {
                nombre,
                estatura,
                genero,
                peso,
                estilo,
                clima,
            });
            Alert.alert('¡Éxito!', 'Perfil actualizado correctamente');
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el perfil');
        }
    };

    const seleccionarFoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (result.canceled) return;

        try {
            const user = auth.currentUser;
            if (!user) return;

            const uri = result.assets[0].uri;
            const response = await fetch(uri);
            const blob = await response.blob();

            //  Ruta: Perfiles/UID/imagen_perfil.jpg
            const storageRef = ref(storage, `Perfiles/${user.uid}/imagen_perfil.jpg`);
            await uploadBytesResumable(storageRef, blob);

            const downloadURL = await getDownloadURL(storageRef);

            // Guardar URL en Firestore
            await updateDoc(doc(db, 'Usuarios', user.uid), {
                urlImagenPerfil: downloadURL,
            });

            setFotoPerfil(downloadURL);
            Alert.alert( 'Foto de perfil actualizada');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo subir la foto');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {/* ── HEADER ── */}
            <View style={styles.header}>
                {/* --------------------------------logo*/}
                <Image
                    source={require('@/assets/images/Logo_GarzaStyle.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <View style={styles.headerRight}>
                    <Text style={styles.horaTexto}>{hora}</Text>
                    <Text style={styles.tempTexto}>{climar}</Text>
                </View>
            </View>

            <Text style={styles.bienvenidaTexto}>BIENVENIDO {nombre.toUpperCase()}!</Text>

            {/* ── MENÚ ── */}
            <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(!menuVisible)}>
                <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>

            {menuVisible && (
                <>
                    <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)} />
                    <View style={styles.menu}>
                        <TouchableOpacity onPress={() => { setMenuVisible(false); router.push('/Home'); }}>
                            <Image source={require('@/assets/images/House.png')} style={styles.menuImage} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setMenuVisible(false); router.push('/Armario'); }}>
                            <Image source={require('@/assets/images/Gancho.png')} style={styles.menuImage} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setMenuVisible(false)}>
                            <Image source={require('@/assets/images/Camara.png')} style={styles.menuImage} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setMenuVisible(false)}>
                            <Image source={require('@/assets/images/Camisa.png')} style={styles.menuImage} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setMenuVisible(false); router.push('/Guardados'); }}>
                            <Image source={require('@/assets/images/Guardar.png')} style={styles.menuImage} />
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── FOTO DE PERFIL ── */}
                <TouchableOpacity style={styles.fotoContainer} onPress={seleccionarFoto}>
                    {fotoPerfil ? (
                        <Image source={{ uri: fotoPerfil }} style={styles.fotoPerfil} />
                    ) : (
                        <View style={styles.fotoPlaceholder}>
                            {/*  ICONO USUARIO  */}
                            <Image
                                source={require('@/assets/images/camaran.png')}
                                style={styles.iconoUsuario}
                                resizeMode="contain"
                            />
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={styles.nombreFoto}>{nombre.toUpperCase()}</Text>

                {/* ── BOTONES ESTADÍSTICAS ── */}
                <View style={styles.statsRow}>
                    <TouchableOpacity style={styles.statBtn} onPress={guardarCambios}>
                        <Text style={styles.statTexto}>Total de{'\n'}prendas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statBtn} onPress={guardarCambios}>
                        <Text style={styles.statTexto}>Guardar{'\n'}cambios</Text>
                    </TouchableOpacity>
                </View>

                {/* ── CAMPOS EDITABLES ── */}

                {/* Nombre */}
                <View style={styles.campo}>
                    {/*  ICONO NOMBRE  */}
                    <Image source={require('@/assets/images/perfil.png')} style={styles.iconoCampo} resizeMode="contain" />
                    <TextInput
                        style={styles.campoInput}
                        value={nombre}
                        onChangeText={setNombre}
                        placeholder="Nombre"
                        placeholderTextColor="#aaa"
                    />
                </View>
                <View style={styles.separador} />

                {/* Estatura */}
                <View style={styles.campo}>
                    {/*  ICONO ESTATURA  */}
                    <Image source={require('@/assets/images/estatura.png')} style={styles.iconoCampo} resizeMode="contain" />
                    <TextInput
                        style={styles.campoInput}
                        value={estatura}
                        onChangeText={setEstatura}
                        placeholder="Estatura (cm)"
                        placeholderTextColor="#aaa"
                        keyboardType="numeric"
                    />
                </View>
                <View style={styles.separador} />

                {/* Género */}
                <View style={styles.campo}>
                    {/*  ICONO GÉNERO  */}
                    <Image source={require('@/assets/images/genero.png')} style={styles.iconoCampo} resizeMode="contain" />
                    <TextInput
                        style={styles.campoInput}
                        value={genero}
                        onChangeText={setGenero}
                        placeholder="Género"
                        placeholderTextColor="#aaa"
                    />
                </View>
                <View style={styles.separador} />

                {/* Peso */}
                <View style={styles.campo}>
                    {/*  ICONO PESO */}
                    <Image source={require('@/assets/images/peso.png')} style={styles.iconoCampo} resizeMode="contain" />
                    <TextInput
                        style={styles.campoInput}
                        value={peso}
                        onChangeText={setPeso}
                        placeholder="Peso (kg)"
                        placeholderTextColor="#aaa"
                        keyboardType="numeric"
                    />
                </View>
                <View style={styles.separador} />

                {/* Estilo favorito */}
                <View style={styles.campo}>
                    {/*  ICONO ESTILO  */}
                    <Image source={require('@/assets/images/estilo.png')} style={styles.iconoCampo} resizeMode="contain" />
                    <TextInput
                        style={styles.campoInput}
                        value={estilo}
                        onChangeText={setEstilo}
                        placeholder="Estilo favorito"
                        placeholderTextColor="#aaa"
                    />
                </View>
                <View style={styles.separador} />

                {/* Clima actual */}
                <View style={styles.campo}>
                    {/*  ICONO CLIMA */}
                    <Image source={require('@/assets/images/clima.png')} style={styles.iconoCampo} resizeMode="contain" />
                    <TextInput
                        style={styles.campoInput}
                        value={clima}
                        onChangeText={setClima}
                        placeholder="Clima actual"
                        placeholderTextColor="#aaa"
                    />
                </View>
                <View style={styles.separador} />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingTop: Platform.OS === 'ios' ? hp(5) : hp(3),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
    },
    logo: {
        width: isTablet ? wp(40) : wp(50),
        height: isTablet ? hp(8) : hp(10),
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    horaTexto: {
        fontSize: isTablet ? wp(3) : wp(4),
        color: '#000',
        fontWeight: 'bold',
    },
    tempTexto: {
        fontSize: isTablet ? wp(2.5) : wp(3.5),
        color: '#000',
        fontWeight: '600',
    },
    bienvenidaTexto: {
        fontSize: isSmallDevice ? wp(3.5) : isTablet ? wp(3) : wp(4),
        fontWeight: 'bold',
        color: '#000',
        letterSpacing: 1,
        paddingHorizontal: wp(5),
        marginTop: hp(0.5),
    },
    menuButton: {
        position: 'absolute',
        top: isTablet ? hp(12) : hp(14),
        right: wp(5),
        zIndex: 100,
        backgroundColor: '#eee',
        padding: wp(2),
        borderRadius: wp(2),
    },

    menuIcon: {
        fontSize: isTablet ? wp(5) : wp(7),
        color: '#000000',
    },
    menu: {
        position: 'absolute',
        top: isTablet ? hp(20) : hp(22),
        right: wp(2),
        width: isTablet ? wp(25) : wp(35),
        backgroundColor: '#4e4e4e',
        padding: wp(5),
        borderRadius: wp(3),
        elevation: 10,
        zIndex: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    menuImage: {
        height: hp(7),
        width: '100%',
        resizeMode: 'contain',
        marginBottom: hp(1.5),
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 250,
    },
    scroll: {
        flex: 1,
        marginTop: hp(1),
    },
    scrollContent: {
        alignItems: 'center',
        paddingBottom: hp(8),
        paddingHorizontal: wp(5),
    },
    // Foto perfil
    fotoContainer: {
        marginTop: hp(2),
        marginBottom: hp(1),
    },
    fotoPerfil: {
        width: wp(35),
        height: wp(35),
        borderRadius: wp(17.5),
    },
    fotoPlaceholder: {
        width: wp(35),
        height: wp(35),
        borderRadius: wp(17.5),
        backgroundColor: '#c0c0c0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconoUsuario: {
        width: wp(18),
        height: wp(18),
    },
    nombreFoto: {
        fontSize: isSmallDevice ? wp(4) : isTablet ? wp(3) : wp(4.5),
        fontWeight: '900',
        color: '#000',
        letterSpacing: 2,
        marginBottom: hp(2),
    },
    // Botones estadísticas
    statsRow: {
        flexDirection: 'row',
        gap: wp(4),
        marginBottom: hp(3),
        width: '100%',
    },
    statBtn: {
        flex: 1,
        backgroundColor: '#c8b98a',
        borderRadius: wp(5),
        paddingVertical: hp(2.5),
        alignItems: 'center',
        justifyContent: 'center',
    },
    statTexto: {
        color: '#fff',
        fontWeight: '900',
        fontSize: isSmallDevice ? wp(3.5) : isTablet ? wp(2.5) : wp(4),
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // Campos
    campo: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: hp(1.2),
    },
    iconoCampo: {
        width: wp(8),
        height: wp(8),
        marginRight: wp(4),
    },
    campoInput: {
        flex: 1,
        fontSize: isSmallDevice ? wp(3.8) : isTablet ? wp(2.8) : wp(4.5),
        fontWeight: '700',
        color: '#000',
    },
    separador: {
        width: '100%',
        height: 1,
        backgroundColor: '#ddd',
    },
});