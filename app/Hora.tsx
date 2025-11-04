import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// 1. Crear el contexto
const HoraContext = createContext('');

// 2. Definir props del proveedor Cambio Prueba otto 
type HoraProviderProps = {
  children: ReactNode;
};

// 3. Proveedor de contexto con tipado
export function HoraProvider({ children }: HoraProviderProps) {
  const [hora, setHora] = useState(
    new Date().toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit'
    })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setHora(
        now.toLocaleTimeString('en-US', {
          hour12: true,
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <HoraContext.Provider value={hora}>{children}</HoraContext.Provider>;
}

// 4. Hook para consumir el contexto
export function useHora() {
  return useContext(HoraContext);
}
