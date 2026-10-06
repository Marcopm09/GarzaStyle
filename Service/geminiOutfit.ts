import { GoogleGenAI } from '@google/genai';

// Inicializa Gemini con tu variable de entorno
const ai = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY });

export async function sugerirOutfitConIA(clima: any, hora: string, prendasPorSeccion: { [key: string]: { uri: string; docId: string }[] }) {
    try {
        // 1. Preparar las listas de prendas con sus índices para que la IA sepa cuáles elegir
        const resumenArmario = {
            camisas: prendasPorSeccion['Camisas / Playeras']?.map((item, index) => ({ indice: index, uri: item.uri })) || [],
            pantalones: prendasPorSeccion['Pantalones / Shorts / Faldas']?.map((item, index) => ({ indice: index, uri: item.uri })) || [],
            zapatos: prendasPorSeccion['Tenis / Zapatos']?.map((item, index) => ({ indice: index, uri: item.uri })) || [],
            accesorios: prendasPorSeccion['Accesorios']?.map((item, index) => ({ indice: index, uri: item.uri })) || [],
        };

        // Si el usuario no tiene ropa en alguna categoría clave, evitamos llamar a la IA
        if (resumenArmario.camisas.length === 0 || resumenArmario.pantalones.length === 0) {
            throw new Error('Faltan prendas básicas en el armario');
        }

        // 2. Construir el prompt para Gemini
        const prompt = `
      Actúa como un asesor de moda profesional e Inteligente. 
      Contexto actual:
      - Clima: Temperatura ${clima?.temp || 'desconocida'}°C, Condición: ${clima?.condicion || 'normal'}.
      - Momento del día: ${hora}.

      Tengo las siguientes prendas disponibles en mi armario con sus respectivos índices numéricos:
      ${JSON.stringify(resumenArmario)}

      Elige la mejor combinación de outfit para hoy considerando el clima y la hora.
      Debes responder ESTRICTAMENTE en formato JSON plano (sin bloques de código markdown extra, solo el objeto JSON), con la siguiente estructura exacta:
      {
        "indiceCamisa": número,
        "indicePantalon": número,
        "indiceZapatos": número,
        "indiceAccesorios": número o null,
        "nombreOutfit": "Nombre creativo del estilo",
        "explicacion": "Breve explicación de por qué combinan y cómo se adaptan al clima de hoy."
      }
    `;

        // 3. Llamar al modelo gemini-2.5-flash
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: prompt,
        });

        const textoRespuesta = response.text;
        if (!textoRespuesta) throw new Error('No se recibió respuesta de la IA');

        // Limpiar posibles marcas de código markdown que la IA a veces añade
        const jsonLimpiado = textoRespuesta.replace(/```json/g, '').replace(/```/g, '').trim();
        const resultadoJSON = JSON.parse(jsonLimpiado);

        return resultadoJSON;

    } catch (error) {
        console.error('❌ Error al consultar la IA de Gemini:', error);
        return null; // Si falla, retornamos null para activar el respaldo (fallback)
    }
}