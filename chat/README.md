# Chat con Mistral

App web mínima con una interfaz de chat que llama a la API de Mistral desde el servidor usando el SDK oficial de TypeScript (`@mistralai/mistralai`), con el modelo `mistral-small-latest`.

## Estructura

```
chat/
├── server.js          # Servidor Express + SDK de Mistral (la clave nunca sale del servidor)
├── public/index.html  # Interfaz de chat
├── .env.example       # Plantilla de variables de entorno
└── package.json
```

## Puesta en marcha

1. Instala dependencias:

   ```bash
   cd chat
   npm install
   ```

2. Configura tu clave de API (queda solo en el servidor):

   ```bash
   cp .env.example .env
   # Edita .env y sustituye "tu_clave_aqui" por tu clave real de https://console.mistral.ai/
   ```

3. Arranca en local:

   ```bash
   npm run dev   # modo desarrollo (reinicia al guardar)
   # o
   npm start     # modo normal
   ```

4. Abre <http://localhost:3000> y escribe en el chat.

## Cómo funciona

- El navegador nunca ve la clave: solo habla con `POST /api/chat` del servidor Express.
- El servidor crea el cliente con `new Mistral({ apiKey: process.env.MISTRAL_API_KEY })` y responde con `mistral-small-latest` manteniendo un pequeño historial de la conversación en memoria.
- `.env` está en `.gitignore` para que la clave no se suba al repositorio.
