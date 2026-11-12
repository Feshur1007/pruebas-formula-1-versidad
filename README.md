# pruebas-formula-1-versidad

## Requisitos

- Node.js 20.19 o superior (recomendado 22.12 o superior).
- npm, que se instala junto con Node.js.

## Instalación

La primera vez, después de clonar o descargar el proyecto, instala las dependencias:

```bash
npm install
```

Eso crea la carpeta `node_modules` (no viene incluida en el repositorio). Si al
ejecutar un comando aparece `"vite" no se reconoce como un comando interno o
externo`, significa que faltó ejecutar `npm install` en la carpeta del proyecto.

## Modo de prueba sin API

Para probar la aplicación sin una clave ni conexión con el servicio externo:

1. Ejecuta `npm run dev:demo`.
2. Abre la dirección local que muestra Vite y crea una cuenta desde **Crear cuenta**.
3. Recarga saldo y prueba reservas, pagos, movimientos y administración de la cuenta.

Este modo guarda los datos solo en el almacenamiento local de ese navegador. Las
recargas y los pagos son simulados: no se conecta a un banco ni se cobra dinero
real. No uses este modo para producción ni guardes datos reales.

## Configuración de la API real

La clave de la API es personal: **no se sube a GitHub ni se comparte** (ni con el equipo).
Cada integrante usa la suya.

1. Copia `server/.env.example` como `server/.env`.
2. Abre `server/.env` y reemplaza `DEPOSITA_TU_CLAVE_AQUI` por tu clave.
3. En una terminal: `npm run api` (servidor que agrega la clave, requiere Node 20.6 o superior).
4. En otra terminal: `npm run dev`.

React llama a `/api/...`; la clave solo la conoce `server/index.js`.
