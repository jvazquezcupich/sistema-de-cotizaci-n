# Chat Mistral · Multicotizador

App web mínima con interfaz de chat que llama a la API de Mistral usando el SDK oficial de TypeScript (`@mistralai/mistralai`) con el modelo `mistral-small-latest`.

La clave `MISTRAL_API_KEY` vive **solo en el servidor** (variable de entorno / archivo `.env`, ignorado por git). El navegador nunca ve la clave: solo llama al endpoint local `/api/chat`.

## Modo HTML único (sin servidor, cualquier navegador)

`chat-mistral.html` es un archivo único y autónomo: ábrelo con doble clic en cualquier navegador moderno (Chrome, Edge, Firefox, Safari), o sírvelo como página estática (p. ej. GitHub Pages), y funciona sin instalar nada.

- Pega tu `MISTRAL_API_KEY` en el campo superior; el archivo no contiene ninguna clave.
- Si marcas "Recordarla en este navegador", se guarda solo en el `localStorage` de tu navegador.
- La llamada a `https://api.mistral.ai/v1/chat/completions` (modelo `mistral-small-latest`) se hace directamente desde tu navegador (la API de Mistral permite CORS).

Advertencia de seguridad: en este modo la clave viaja desde tu navegador y es visible en las herramientas de desarrollo / pestaña de red de quien use la página. Es válido para uso personal; para no exponer la clave usa la versión con servidor descrita abajo.

## Requisitos (versión con servidor)

## Instalación de dependencias

```bash
npm install
```

## Configuración

```bash
cp .env.example .env
```

Edita `.env` y añade tu clave de Mistral (consíguela en [Mistral AI Console](https://console.mistral.ai/)):

```
MISTRAL_API_KEY=tu-api-key-de-mistral
PORT=3000
```

## Ejecutar en local

Modo desarrollo (con recarga automática):

```bash
npm run dev
```

Modo producción:

```bash
npm run build
npm start
```

Abre <http://localhost:3000> (o el puerto definido en `PORT`).

## Probar la API directamente

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hola, ¿qué seguros puedo cotizar?"}]}'
```

Respuesta: `{"reply":"..."}`

## Estructura

- `chat-mistral.html` — versión de un solo archivo HTML que funciona en cualquier navegador sin servidor (la clave se ingresa en tiempo de ejecución y nunca se escribe en el archivo).
- `src/server.ts` — servidor HTTP en Node (sin framework) en TypeScript: sirve los estáticos de `public/` y atiende `POST /api/chat` llamando a Mistral con el SDK oficial.
- `public/index.html`, `public/app.js`, `public/styles.css` — interfaz de chat del servidor (HTML/CSS/JS vanilla, en español).
- `.env.example` — plantilla de variables de entorno.
- `tsconfig.json` — configuración de TypeScript (compila a `dist/`).

Dentro de este repositorio la app vive en `chat/`; el cotizador (`cotizador.html`) está en la raíz del repo. Para servir ambos desde el mismo servidor, copia `cotizador.html` a `chat/public/` y ábrelo en `/cotizador.html`.

## Seguridad

- Versión con servidor: `MISTRAL_API_KEY` se lee únicamente en el servidor desde `process.env`; no se expone al cliente ni se registra.
- Versión HTML único: el archivo no contiene claves; la que pegues se usa solo desde tu navegador (y opcionalmente queda en tu `localStorage`).
- `.env` está en `.gitignore`.
- El frontend usa una CSP restrictiva (`connect-src 'self'`) y el servidor valida el formato, el número y la longitud de los mensajes.
