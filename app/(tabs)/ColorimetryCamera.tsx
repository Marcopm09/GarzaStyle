import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const GOLD = '#D4AF37'; 
const DARK_BG = '#0A0A0A';
const CARD_BG = '#1A1A1A';

export default function ColorimetryCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<any>(null);

  // Simulación de Escaneo Biométrico y Cromático
  useEffect(() => {
    if (scanning && permission?.granted) {
      const timer = setTimeout(() => {
        autoAnalyze();
      }, 4000); // 4 segundos para un escaneo más "profundo"
      return () => clearTimeout(timer);
    }
  }, [scanning, permission]);

  const autoAnalyze = () => {
    // Motor de Reglas Prestige: Genera resultados basados en análisis visual simulado
    setResult({
      faceShape: 'Ovalada',
      skinTone: 'Trigueño Cálido',
      season: 'Otoño Profundo',
      contrast: 'Alto',
      palette: ['#D4AF37', '#8B4513', '#2F4F4F', '#1A1A1A', '#E76BA7'],
      advice: 'Tu subtono cálido resalta con metales dorados. Para tu rostro ovalado, los lentes de armazón cuadrado equilibrarán tus facciones.'
    });
    setScanning(false);
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-reverse-outline" size={60} color={GOLD} />
        <Text style={styles.infoText}>Acceso a cámara requerido para el análisis</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>CONCEDER PERMISO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scanning ? (
        <CameraView style={styles.camera} facing="front">
          <View style={styles.overlay}>
            {/* Marco de Escaneo Dorado */}
            <View style={styles.scanFrame}>
              <View style={styles.scannerLine} />
            </View>
            
            <View style={styles.scanInfo}>
              <Text style={styles.scanTitle}>ESCANEO CROMÁTICO ACTIVO</Text>
              <Text style={styles.scanSub}>MANTÉN EL ROSTRO DENTRO DEL MARCO</Text>
            </View>
            
            <Text style={styles.brandTag}>GARZASTYLE AI v2.0</Text>
          </View>
        </CameraView>
      ) : (
        <ScrollView contentContainerStyle={styles.resultScroll}>
          <View style={styles.resHeader}>
            <Ionicons name="shield-checkmark" size={40} color={GOLD} />
            <Text style={styles.resTitle}>PERFIL LOGRADO</Text>
          </View>

          {/* Tarjetas de Datos Técnicos */}
          <View style={styles.statsGrid}>
            <StatCard label="FORMA" value={result.faceShape} />
            <StatCard label="PIEL" value={result.skinTone} />
            <StatCard label="ESTACIÓN" value={result.season} />
            <StatCard label="CONTRASTE" value={result.contrast} />
          </View>

          {/* Sección de Colores Recomendados */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PALETA DE COLORES RECOMENDADA</Text>
            <View style={styles.palette}>
              {result.palette.map((color: string, i: number) => (
                <View key={i} style={styles.colorWrapper}>
                  <View style={[styles.colorCircle, { backgroundColor: color }]} />
                  <Text style={styles.colorText}>{color}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Asesoría de Estilo */}
          <View style={styles.adviceCard}>
            <Text style={styles.adviceLabel}>ASESORÍA PERSONALIZADA</Text>
            <Text style={styles.adviceText}>{result.advice}</Text>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={() => setScanning(true)}>
            <Text style={styles.resetText}>REPETIR ESCANEO</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

// Sub-componentes con tipado para evitar errores de compilación
const StatCard = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value.toUpperCase()}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: width * 0.7, height: height * 0.45, borderWidth: 1, borderColor: GOLD, borderRadius: 150, borderStyle: 'dashed' },
  scannerLine: { width: '100%', height: 3, backgroundColor: GOLD, shadowColor: GOLD, shadowOpacity: 0.9, shadowRadius: 20, elevation: 15, position: 'absolute', top: '50%' },
  scanInfo: { marginTop: 40, alignItems: 'center' },
  scanTitle: { color: GOLD, fontWeight: '900', letterSpacing: 3, fontSize: 14 },
  scanSub: { color: '#fff', fontSize: 10, marginTop: 5, opacity: 0.6 },
  brandTag: { position: 'absolute', bottom: 40, color: GOLD, fontSize: 12, letterSpacing: 5, fontWeight: 'bold' },
  resultScroll: { padding: 30, alignItems: 'center' },
  resHeader: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  resTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 4, marginTop: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  statCard: { backgroundColor: CARD_BG, width: '48%', padding: 15, borderRadius: 2, marginBottom: 15, borderLeftWidth: 2, borderLeftColor: GOLD },
  statLabel: { color: GOLD, fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  statValue: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginTop: 5 },
  section: { width: '100%', marginVertical: 20, alignItems: 'center' },
  sectionTitle: { color: '#555', fontSize: 10, letterSpacing: 2, marginBottom: 20 },
  palette: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  colorWrapper: { alignItems: 'center' },
  colorCircle: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 1, borderColor: '#333' },
  colorText: { color: '#444', fontSize: 8, marginTop: 5 },
  adviceCard: { backgroundColor: CARD_BG, padding: 25, width: '100%', borderTopWidth: 1, borderColor: GOLD },
  adviceLabel: { color: GOLD, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  adviceText: { color: '#eee', fontSize: 15, lineHeight: 24, fontStyle: 'italic' },
  resetBtn: { marginTop: 40, paddingBottom: 50 },
  resetText: { color: GOLD, fontSize: 12, fontWeight: 'bold', letterSpacing: 3, textDecorationLine: 'underline' },
  infoText: { color: '#fff', textAlign: 'center', marginVertical: 20 },
  btn: { backgroundColor: GOLD, paddingHorizontal: 30, paddingVertical: 12 },
  btnText: { fontWeight: 'bold', letterSpacing: 1 }
});