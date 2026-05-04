import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
 
// 1. Crear el contexto de clima
const ClimaContext = createContext('--°C');
 
// 2. Definir props del proveedor
type ClimaProviderProps = {
  children: ReactNode;
};
 
// 3. Proveedor de contexto con tipado
export function ClimaProvider({ children }: ClimaProviderProps) {
  const [clima, setClima] = useState('--°C');
 
  useEffect(() => {
    const obtenerClima = async () => {
      try {
        // 👇 REEMPLAZA con tu API key de openweathermap.org (es gratis)
        const API_KEY = '07ebf71820be983b86daf4a4ee044697';
 
        // 👇 REEMPLAZA con tu ciudad y país, ejemplos:
        //    'Monterrey,MX'  /  'Mexico City,MX'  /  'Guadalajara,MX'
        const CIUDAD = 'Mexico City,MX';
 
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${CIUDAD}&appid=${API_KEY}&units=metric`

        );
        const data = await response.json();
        console.log('CLIMA DATA:', JSON.stringify(data)); 
        if (data.main?.temp !== undefined) {
          const temp = Math.round(data.main.temp);
          setClima(`${temp}°C`);
        }
      } catch (error) {
        console.error('❌ Error obteniendo clima:', error);
        setClima('--°C');
      }
    };
 
    // Obtener clima al montar
    obtenerClima();
 
    // Actualizar cada 10 minutos
    const interval = setInterval(obtenerClima, 10 * 60 * 1000);
 
    return () => clearInterval(interval);
  }, []);
 
  return <ClimaContext.Provider value={clima}>{children}</ClimaContext.Provider>;
}
 
// 4. Hook para consumir el contexto
export function useClima() {
  return useContext(ClimaContext);
}