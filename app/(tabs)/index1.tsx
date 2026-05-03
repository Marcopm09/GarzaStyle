import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Verificamos que el navegador esté montado (key existe)
    if (navigationState?.key) {
      // Redirigir a la cámara o al feed principal
      // router.replace('/(tabs)/camera'); 
    }
  }, [navigationState?.key]);

  // Mientras se monta, mostramos un cargador con la estética del proyecto
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}