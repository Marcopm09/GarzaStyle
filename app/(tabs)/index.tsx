

// app/(tabs)/index.tsx
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function IndexRedirect() {
  useEffect(() => {
    router.replace('/Home'); // ← esta es la pantalla que quieres que cargue primero
  }, []);

  return null; // No se muestra nada porque redirige automáticamente
}

