import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { 
  collection, 
  query, 
  getDocs, 
  updateDoc, 
  doc, 
  arrayUnion, 
  addDoc, 
  increment, 
  orderBy,
  arrayRemove
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

const { width } = Dimensions.get('window');
const wp = (p: number) => (width * p) / 100;

export default function RedSocial() {
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nuevoComentario, setNuevoComentario] = useState<{ [key: string]: string }>({});

  const cargarFeed = async () => {
    try {
      const q = query(collection(db, 'Publicaciones'), orderBy('fechaPublicacion', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPublicaciones(data);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarFeed();
  }, []);
const darLike = async (id: string, item: any) => {
  const user = auth.currentUser;
  if (!user) return;

  // Validación: si el campo no existe en el post viejo, lo tratamos como array vacío
  const listaLikes = item.usuariosQueDieronLike || [];
  const yaDioLike = listaLikes.includes(user.uid);

  try {
    const docRef = doc(db, 'Publicaciones', id);
    await updateDoc(docRef, {
      likes: yaDioLike ? increment(-1) : increment(1),
      usuariosQueDieronLike: yaDioLike ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
    cargarFeed();
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Revisa tus reglas de Firebase o tu conexión.");
  }
};

const enviarComentario = async (id: string) => {
  const user = auth.currentUser;
  const texto = nuevoComentario[id];
  if (!user || !texto?.trim()) return;

  try {
    const docRef = doc(db, 'Publicaciones', id);
    // Usamos updateDoc. Si el post es viejo y no tiene el campo 'comentarios', 
    // arrayUnion lo creará automáticamente si las reglas lo permiten.
    await updateDoc(docRef, {
      comentarios: arrayUnion({
        usuario: user.displayName || "☆",
        texto: texto.trim(),
        fecha: new Date().toISOString()
      })
    });
    setNuevoComentario({ ...nuevoComentario, [id]: "" });
    cargarFeed();
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "No se pudo publicar el comentario.");
  }
};
  const guardarEnMiArmario = async (prendas: any) => {
    try {
      await addDoc(collection(db, 'Conjuntos'), {
        usuarioID: auth.currentUser?.uid,
        prendas,
        fecha: new Date(),
        nombre: "Inspiración de la Red"
      });
      Alert.alert("¡Éxito!", "Look guardado en tu armario.");
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar");
    }
  };

  if (cargando) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>GARZASTYLE</Text>
        <Text style={styles.headerSubtitle}>GRWM CHECK</Text>
      </View>

      <FlatList
        data={publicaciones}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const yaDioLike = item.usuariosQueDieronLike?.includes(auth.currentUser?.uid);
          return (
            <View style={styles.postCard}>
              <Text style={styles.userName}>@{item.nombreUsuario || 'Usuario'}</Text>
              
              {/* Muestra TODAS las prendas */}
              <View style={styles.outfitGrid}>
                {item.prendas?.accesorios && (
                  <View style={styles.itemWrapper}>
                    <Text style={styles.itemTag}>Accesorio</Text>
                    <Image source={{ uri: item.prendas.accesorios }} style={styles.itemImg} />
                  </View>
                )}
                {item.prendas?.camisa && (
                  <View style={styles.itemWrapper}>
                    <Text style={styles.itemTag}>Superior</Text>
                    <Image source={{ uri: item.prendas.camisa }} style={styles.itemImg} />
                  </View>
                )}
                {item.prendas?.pantalon && (
                  <View style={styles.itemWrapper}>
                    <Text style={styles.itemTag}>Inferior</Text>
                    <Image source={{ uri: item.prendas.pantalon }} style={styles.itemImg} />
                  </View>
                )}
                {item.prendas?.zapatos && (
                  <View style={styles.itemWrapper}>
                    <Text style={styles.itemTag}>Calzado</Text>
                    <Image source={{ uri: item.prendas.zapatos }} style={styles.itemImg} />
                  </View>
                )}
              </View>

              <View style={styles.footerCard}>
                <TouchableOpacity 
  onPress={() => darLike(item.id, yaDioLike)} 
  style={[
    styles.likeButtonContainer, 
    yaDioLike ? styles.likeActiveBackground : styles.likeInactiveBorder
  ]}
>
  <View style={styles.iconWrapper}>
    <Text style={styles.heartIcon}>❤️</Text>
    <Text style={[
      styles.likeCount, 
      yaDioLike ? styles.textWhite : styles.textBlack
    ]}>
      {item.likes || 0}
    </Text>
  </View>
</TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => guardarEnMiArmario(item.prendas)} 
                  style={styles.blackAction}
                >
                  <Text style={styles.actionTextWhite}>GUARDAR LOOK</Text>
                </TouchableOpacity>
              </View>

              {/* Sección de Comentarios */}
              <View style={styles.commentSection}>
                {item.comentarios?.map((c: any, index: number) => (
                  <Text key={index} style={styles.commentText}>
                    <Text style={{ fontWeight: 'bold' }}>{c.usuario}: </Text>{c.texto}
                  </Text>
                ))}
                
                <View style={styles.inputContainer}>
                  <TextInput
                    placeholder="Añadir comentario..."
                    placeholderTextColor="#999"
                    style={styles.commentInput}
                    value={nuevoComentario[item.id] || ""}
                    onChangeText={(txt) => setNuevoComentario({ ...nuevoComentario, [item.id]: txt })}
                  />
                  <TouchableOpacity onPress={() => enviarComentario(item.id)}>
                    <Text style={styles.sendText}>Enviar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  headerContainer: { marginTop: 50, marginBottom: 10, alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  headerSubtitle: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold', marginTop: -5 },
  postCard: { 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 15, 
    marginBottom: 25, 
    borderRadius: 20, 
    padding: 15,
    borderLeftWidth: 6,
    borderColor: '#D4AF37' 
  },
  userName: { color: '#000', fontWeight: '800', fontSize: 16, marginBottom: 15 },
  outfitGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  itemWrapper: { alignItems: 'center', width: wp(38), backgroundColor: '#f5f5f5', borderRadius: 10, padding: 5, marginBottom: 5 },
  itemTag: { fontSize: 9, color: '#D4AF37', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  itemImg: { width: wp(30), height: wp(30), resizeMode: 'contain' },
  footerCard: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15 },
  goldAction: { backgroundColor: '#D4AF37', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10 },
  blackAction: { backgroundColor: '#000', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10 },
  actionTextBold: { color: '#000', fontWeight: '900', fontSize: 11 },
  actionTextWhite: { color: '#FFF', fontWeight: '900', fontSize: 11 },
  commentSection: { marginTop: 10 },
  commentText: { fontSize: 12, color: '#333', marginBottom: 3 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 10 },
  commentInput: { flex: 1, height: 35, fontSize: 12, color: '#000' },
  sendText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 12, marginLeft: 5 },

  likeButtonContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    // Eliminé 'transition' porque causa error en React Native
  },
  likeInactiveBorder: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#000000',
  },
  likeActiveBackground: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
  },
  iconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heartIcon: {
    fontSize: 18,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: '900',
  },
  textBlack: {
    color: '#000000',
  },
  textWhite: {
    color: '#FFFFFF',
  },
});