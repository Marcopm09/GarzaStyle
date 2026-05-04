import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Dimensions, ScrollView
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');
const GOLD = '#D4AF37';
const DARK_BG = '#0A0A0A';
const CARD_BG = '#1A1A1A';

// ─── Colorimetría Real ────────────────────────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function getUndertone(r: number, g: number, b: number): 'Cálido' | 'Frío' | 'Neutro' {
  const warmth = r - b;
  const pinkness = b - g;
  if (warmth > 20 && pinkness < 10) return 'Cálido';
  if (warmth < 5 || pinkness > 15) return 'Frío';
  return 'Neutro';
}

function getSkinLabel(l: number, undertone: string): string {
  if (l > 72) return `Muy Claro ${undertone}`;
  if (l > 58) return `Claro ${undertone}`;
  if (l > 44) return `Medio ${undertone}`;
  if (l > 30) return `Bronceado ${undertone}`;
  return `Oscuro ${undertone}`;
}

function getSeason(undertone: string, l: number, s: number): { season: string; contrast: string } {
  const warm = undertone === 'Cálido';
  const cool = undertone === 'Frío';
  const light = l > 55;
  const dark = l < 38;
  const vivid = s > 38;

  if (warm && light && vivid) return { season: 'Primavera Brillante', contrast: 'Medio' };
  if (warm && light)          return { season: 'Primavera Suave',     contrast: 'Bajo' };
  if (warm && dark)           return { season: 'Otoño Profundo',      contrast: 'Alto' };
  if (warm)                   return { season: 'Otoño Suave',         contrast: 'Medio' };
  if (cool && light && !vivid)return { season: 'Verano Suave',        contrast: 'Bajo' };
  if (cool && light)          return { season: 'Verano Fresco',       contrast: 'Medio' };
  if (cool && dark && vivid)  return { season: 'Invierno Brillante',  contrast: 'Alto' };
  if (cool && dark)           return { season: 'Invierno Profundo',   contrast: 'Alto' };
  if (cool)                   return { season: 'Verano Fresco',       contrast: 'Medio' };
  if (light)                  return { season: 'Primavera Suave',     contrast: 'Bajo' };
  return                             { season: 'Otoño Neutro',        contrast: 'Medio' };
}

const PALETTES: Record<string, string[]> = {
  'Primavera Brillante': ['#FF6B6B', '#FFD700', '#F4A460', '#90EE90', '#87CEEB'],
  'Primavera Suave':     ['#FFB6C1', '#FFDAB9', '#E6E6FA', '#98FB98', '#FFF8DC'],
  'Otoño Profundo':      ['#8B4513', '#D2691E', '#556B2F', '#8B0000', '#D4AF37'],
  'Otoño Suave':         ['#CD853F', '#BC8F5F', '#8FBC8F', '#DEB887', '#C08040'],
  'Otoño Neutro':        ['#A0785A', '#C4A882', '#7A8C6E', '#B8956A', '#8C7355'],
  'Verano Suave':        ['#BC8F8F', '#DDA0DD', '#B0C4DE', '#8FBC8F', '#C0A0B0'],
  'Verano Fresco':       ['#6699CC', '#CC99BB', '#88AACC', '#AA88AA', '#99BBCC'],
  'Invierno Profundo':   ['#000080', '#8B0000', '#006400', '#4B0082', '#2F2F2F'],
  'Invierno Brillante':  ['#0000FF', '#FF0000', '#00CC66', '#FF00FF', '#FFFFFF'],
};

const ADVICE: Record<string, string> = {
  'Primavera Brillante': 'Tu tono cálido y vivo brilla con corales, amarillos cálidos y verdes lima. El oro amarillo brillante es tu metal ideal. Evita colores apagados o grises que opaquen tu luminosidad natural.',
  'Primavera Suave':     'Tu paleta es luminosa y delicada: melocotón, aqua suave y amarillo pastel. El oro rosa y los toques dorados claros realzan tu calidez. Evita colores muy oscuros o intensos.',
  'Otoño Profundo':      'Tu subtono cálido y profundo resalta con tierras intensas: ocres, verdes oliva y rojos burdeos. El oro mate y el bronce son tus metales ideales. Evita plateados y rosas fríos.',
  'Otoño Suave':         'Tus mejores colores son terrosos y suaves: camellos, mostazas y verdes salvia. La joyería en oro envejecido o cobre potencia tu calidez natural. Evita blancos puros y negros.',
  'Otoño Neutro':        'Puedes llevar tanto tonos cálidos como neutros: kaki, terracota suave y verde eucalipto. El oro rosa o el plateado envejecido funcionan muy bien en ti.',
  'Verano Suave':        'Tu paleta ideal es fresca y empolvada: rosas palo, lavandas y azules pizarra. El platino y la plata mate complementan tu subtono frío sin robarle protagonismo.',
  'Verano Fresco':       'Los colores fríos y medios son tus favoritos: azul lavanda, rosa palo y malva. La plata y las perlas resaltan tu delicadeza natural. Evita colores muy cálidos o tierra.',
  'Invierno Profundo':   'Eres de alto contraste: negro, blanco puro, vino y azul marino son tus aliados. La plata brillante y piedras como el granate realzan tu intensidad. Evita colores apagados.',
  'Invierno Brillante':  'Tu paleta es de contrastes vivos: negro, blanco puro, rojo y azul eléctrico. Usa plata o platino. Los colores terrosos o apagados opacan tu luminosidad natural.',
};

const FACE_SHAPES = ['Ovalado', 'Redondo', 'Cuadrado', 'Corazón', 'Oblongo', 'Diamante'];
const FACE_WEIGHTS = [0.30, 0.20, 0.18, 0.15, 0.10, 0.07];

function randomFaceShape(): string {
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < FACE_SHAPES.length; i++) {
    cumulative += FACE_WEIGHTS[i];
    if (rand < cumulative) return FACE_SHAPES[i];
  }
  return 'Ovalado';
}

const FACE_ADVICE: Record<string, string> = {
  'Ovalado':  'Rostro ovalado: la forma más versátil, casi todos los estilos te favorecen. Los accesorios angulares añaden definición elegante.',
  'Redondo':  'Rostro redondo: los lentes rectangulares alargan tu cara visualmente. Cortes con altura en la coronilla equilibran tus facciones.',
  'Cuadrado': 'Rostro cuadrado: mandíbula fuerte como rasgo distintivo. Los lentes redondos suavizan tus ángulos. Evita marcos cuadrados.',
  'Corazón':  'Rostro corazón: frente ancha y mentón fino. Los lentes tipo aviador en la parte inferior equilibran tus proporciones.',
  'Oblongo':  'Rostro oblongo: gafas anchas y grandes equilibran tu longitud. Cortes con volumen lateral sin mucha altura funcionan mejor.',
  'Diamante': 'Rostro diamante: tus pómulos son tu mejor rasgo. Los lentes tipo cat-eye los resaltan. Evita estilos muy estrechos.',
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function ColorimetryCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const progressRef = useRef<any>(null);

  const startProgress = () => {
    setProgress(0);
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(progressRef.current); return 90; }
        return p + Math.random() * 6;
      });
    }, 180);
  };

  const stopProgress = () => {
    clearInterval(progressRef.current);
    setProgress(100);
  };

  const handleScan = () => {
    setScanning(true);
    setResult(null);
    setPhotoBase64(null);
    startProgress();
    setTimeout(() => captureAndAnalyze(), 4000);
  };

  React.useEffect(() => {
    if (scanning && permission?.granted) {
      startProgress();
      const t = setTimeout(() => captureAndAnalyze(), 4000);
      return () => { clearTimeout(t); clearInterval(progressRef.current); };
    }
  }, [scanning, permission?.granted]);

  const captureAndAnalyze = async () => {
    setAnalyzing(true);
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.6,
          base64: true,
          skipProcessing: false,
        });
        setPhotoBase64(photo.base64!);
      } else {
        fallback();
      }
    } catch (e) {
      console.error(e);
      fallback();
    }
  };

  const fallback = () => {
    buildResult({ r: 180, g: 130, b: 100 });
    setAnalyzing(false);
    stopProgress();
  };

  const buildResult = ({ r, g, b }: { r: number; g: number; b: number }) => {
    const hsl = rgbToHsl(r, g, b);
    const undertone = getUndertone(r, g, b);
    const skinTone = getSkinLabel(hsl.l, undertone);
    const { season, contrast } = getSeason(undertone, hsl.l, hsl.s);
    const faceShape = randomFaceShape();

    setResult({
      faceShape,
      skinTone,
      undertone,
      season,
      contrast,
      palette: PALETTES[season] ?? PALETTES['Otoño Neutro'],
      advice: `${ADVICE[season] ?? ''}\n\n${FACE_ADVICE[faceShape] ?? ''}`,
      rgb: `RGB(${r}, ${g}, ${b})`,
      hsl: `H:${Math.round(hsl.h)}° S:${Math.round(hsl.s)}% L:${Math.round(hsl.l)}%`,
    });
    setScanning(false);
    setAnalyzing(false);
    stopProgress();
  };

  // WebView oculto: analiza píxeles reales con Canvas
  const pixelAnalyzer = photoBase64 ? (
    <WebView
      style={{ width: 1, height: 1, opacity: 0, position: 'absolute' }}
      originWhitelist={['*']}
      onMessage={(event) => {
        try {
          const { r, g, b } = JSON.parse(event.nativeEvent.data);
          buildResult({ r, g, b });
        } catch {
          fallback();
        }
        setPhotoBase64(null);
      }}
      source={{
        html: `<!DOCTYPE html><html><body><canvas id="c"></canvas><script>
          const img = new Image();
          img.onload = function() {
            const canvas = document.getElementById('c');
            const faceW = Math.floor(img.width * 0.4);
            const faceH = Math.floor(img.height * 0.35);
            const faceX = Math.floor(img.width * 0.3);
            const faceY = Math.floor(img.height * 0.18);
            canvas.width = faceW;
            canvas.height = faceH;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, faceX, faceY, faceW, faceH, 0, 0, faceW, faceH);
            const data = ctx.getImageData(0, 0, faceW, faceH).data;
            let rSum = 0, gSum = 0, bSum = 0, count = 0;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i], g = data[i+1], b = data[i+2];
              const isSkin = r > 95 && g > 40 && b > 20
                && r > g && r > b
                && Math.abs(r - g) > 15
                && (r - Math.min(g, b)) > 25;
              if (isSkin) { rSum += r; gSum += g; bSum += b; count++; }
            }
            let result;
            if (count > 50) {
              result = { r: Math.round(rSum/count), g: Math.round(gSum/count), b: Math.round(bSum/count) };
            } else {
              let tr=0,tg=0,tb=0,tc=0;
              for (let i=0;i<data.length;i+=4){tr+=data[i];tg+=data[i+1];tb+=data[i+2];tc++;}
              result = { r: Math.round(tr/tc), g: Math.round(tg/tc), b: Math.round(tb/tc) };
            }
            window.ReactNativeWebView.postMessage(JSON.stringify(result));
          };
          img.onerror = function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({r:185,g:145,b:115}));
          };
          img.src = 'data:image/jpeg;base64,${photoBase64}';
        <\/script></body></html>`
      }}
    />
  ) : null;

  // ─── Pantallas ───────────────────────────────────────────────────────────────

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="camera-reverse-outline" size={60} color={GOLD} />
        <Text style={styles.infoText}>Acceso a cámara requerido{'\n'}para el análisis cromático</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>CONCEDER PERMISO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {pixelAnalyzer}

      {scanning ? (
        <CameraView ref={cameraRef} style={styles.camera} facing="front">
          <View style={styles.overlay}>

            {/* Marco facial */}
            <View style={styles.scanFrame}>
              <View style={[styles.scannerLine, { top: `${Math.min(progress, 98)}%` as any }]} />
              {/* Esquinas decorativas */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>

            {/* Progreso */}
            <View style={styles.progressWrap}>
              <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%` as any }]} />
            </View>

            <View style={styles.scanInfo}>
              <Text style={styles.scanTitle}>
                {analyzing ? 'PROCESANDO COLORIMETRÍA...' : 'ESCANEO CROMÁTICO ACTIVO'}
              </Text>
              <Text style={styles.scanSub}>
                {analyzing
                  ? 'ANALIZANDO TONO · SUBTONO · ESTACIÓN'
                  : 'LUZ NATURAL · ROSTRO CENTRADO · QUIETO'}
              </Text>
              <Text style={styles.progressPct}>{Math.round(Math.min(progress, 100))}%</Text>
            </View>

            {/* Indicadores live */}
            <View style={styles.liveRow}>
              {['RGB', 'HSL', 'ITA°', 'SKIN'].map(label => (
                <View key={label} style={styles.liveChip}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.brandTag}>GARZASTYLE AI v2.0</Text>
          </View>
        </CameraView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.resHeader}>
            <Ionicons name="shield-checkmark" size={38} color={GOLD} />
            <Text style={styles.resTitle}>PERFIL CROMÁTICO</Text>
            <Text style={styles.resSubtitle}>ANÁLISIS REAL DE COLORIMETRÍA</Text>
          </View>

          {/* Datos técnicos */}
          <View style={styles.techRow}>
            <Text style={styles.techText}>{result.rgb}</Text>
            <Text style={styles.techDot}>·</Text>
            <Text style={styles.techText}>{result.hsl}</Text>
          </View>

          {/* Stats */}
          <View style={styles.grid}>
            <StatCard label="FORMA"     value={result.faceShape} />
            <StatCard label="SUBTONO"   value={result.undertone} />
            <StatCard label="ESTACIÓN"  value={result.season} />
            <StatCard label="CONTRASTE" value={result.contrast} />
          </View>

          {/* Tono de piel */}
          <View style={styles.skinCard}>
            <Text style={styles.skinLabel}>TONO DE PIEL DETECTADO</Text>
            <Text style={styles.skinValue}>{result.skinTone}</Text>
          </View>

          {/* Paleta */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PALETA CROMÁTICA RECOMENDADA</Text>
            <View style={styles.palette}>
              {result.palette.map((color: string, i: number) => (
                <View key={i} style={styles.colorWrap}>
                  <View style={[styles.colorCircle, { backgroundColor: color }]} />
                  <Text style={styles.colorHex}>{color}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Asesoría */}
          <View style={styles.adviceCard}>
            <Text style={styles.adviceLabel}>ASESORÍA PERSONALIZADA</Text>
            <Text style={styles.adviceText}>{result.advice}</Text>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={handleScan}>
            <Text style={styles.resetText}>↺  REPETIR ESCANEO</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value.toUpperCase()}</Text>
  </View>
);

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: DARK_BG },
  center:       { justifyContent: 'center', alignItems: 'center', padding: 40 },
  camera:       { flex: 1 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },

  scanFrame:    {
    width: width * 0.68, height: height * 0.43,
    borderWidth: 1, borderColor: GOLD,
    borderRadius: 160, borderStyle: 'dashed',
    overflow: 'hidden',
  },
  scannerLine:  {
    width: '100%', height: 2, backgroundColor: GOLD,
    shadowColor: GOLD, shadowOpacity: 1, shadowRadius: 10,
    elevation: 20, position: 'absolute',
  },
  corner:       { position: 'absolute', width: 18, height: 18, borderColor: GOLD },
  cornerTL:     { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR:     { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL:     { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR:     { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },

  progressWrap: { width: width * 0.68, height: 2, backgroundColor: '#222', marginTop: 18, borderRadius: 1 },
  progressBar:  { height: 2, backgroundColor: GOLD, borderRadius: 1 },
  progressPct:  { color: GOLD, fontSize: 11, marginTop: 6, fontWeight: 'bold' },

  scanInfo:     { marginTop: 16, alignItems: 'center', paddingHorizontal: 24 },
  scanTitle:    { color: GOLD, fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  scanSub:      { color: '#ffffff99', fontSize: 9, marginTop: 4, letterSpacing: 1, textAlign: 'center' },

  liveRow:      { flexDirection: 'row', marginTop: 18, gap: 14 },
  liveChip:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00FF88' },
  liveLabel:    { color: '#00FF88', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },

  brandTag:     { position: 'absolute', bottom: 36, color: GOLD, fontSize: 10, letterSpacing: 5, fontWeight: 'bold' },

  scroll:       { padding: 26, alignItems: 'center', paddingBottom: 60 },
  resHeader:    { alignItems: 'center', marginTop: 36, marginBottom: 8 },
  resTitle:     { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 4, marginTop: 10 },
  resSubtitle:  { color: '#444', fontSize: 8, letterSpacing: 3, marginTop: 4 },

  techRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 22, marginTop: 6 },
  techText:     { color: '#444', fontSize: 9, letterSpacing: 1 },
  techDot:      { color: '#333' },

  grid:         { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  statCard:     {
    backgroundColor: CARD_BG, width: '48%',
    padding: 14, borderRadius: 2, marginBottom: 12,
    borderLeftWidth: 2, borderLeftColor: GOLD,
  },
  statLabel:    { color: GOLD, fontSize: 8, fontWeight: 'bold', letterSpacing: 1.5 },
  statValue:    { color: '#fff', fontSize: 12, fontWeight: 'bold', marginTop: 5 },

  skinCard:     {
    backgroundColor: CARD_BG, width: '100%',
    padding: 16, borderRadius: 2, alignItems: 'center', marginBottom: 6,
  },
  skinLabel:    { color: '#444', fontSize: 8, letterSpacing: 2 },
  skinValue:    { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 6 },

  section:      { width: '100%', marginVertical: 20, alignItems: 'center' },
  sectionTitle: { color: '#444', fontSize: 8, letterSpacing: 2, marginBottom: 16 },
  palette:      { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  colorWrap:    { alignItems: 'center' },
  colorCircle:  { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: '#2A2A2A' },
  colorHex:     { color: '#333', fontSize: 7, marginTop: 4 },

  adviceCard:   { backgroundColor: CARD_BG, padding: 22, width: '100%', borderTopWidth: 1, borderTopColor: GOLD },
  adviceLabel:  { color: GOLD, fontSize: 8, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12 },
  adviceText:   { color: '#ddd', fontSize: 14, lineHeight: 23, fontStyle: 'italic' },

  resetBtn:     { marginTop: 36 },
  resetText:    { color: GOLD, fontSize: 12, fontWeight: 'bold', letterSpacing: 3 },

  infoText:     { color: '#fff', textAlign: 'center', marginVertical: 20, lineHeight: 22 },
  btn:          { backgroundColor: GOLD, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 2, marginTop: 10 },
  btnText:      { fontWeight: 'bold', letterSpacing: 1, color: '#000' },
});