import { Stack } from 'expo-router';
import React from 'react';
import { HoraProvider } from '../Hora';

export default function Layout() {
  return (
    <HoraProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'default',
        }}
      />
    </HoraProvider>
  );
}
