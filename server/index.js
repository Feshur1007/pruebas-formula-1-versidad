// Servidor intermedio: recibe las peticiones de React, les agrega la clave
// del proyecto (X-API-Key) y las reenvia a la API. La clave vive solo aqui.
import http from 'node:http'
import process from 'node:process'

const { API_BASE_URL, API_TOKEN, PORT = 3001 } = process.env

if (!API_BASE_URL || !API_TOKEN || API_TOKEN === 'DEPOSITA_TU_CLAVE_AQUI') {
  console.error('Falta configurar server/.env (copia server/.env.example y deposita tu clave).')
  process.exit(1)
}

// Solo se reenvian estas rutas; cualquier otra se rechaza.
const PERMITIDAS = [
  ['GET', '/config'],
  ['GET', '/key'],
  ['POST', '/auth/register'],
  ['POST', '/auth/login'],
  ['POST', '/auth/refresh'],
  ['POST', '/auth/logout'],
  ['GET', '/auth/me'],
  ['POST', '/auth/password'],
  ['PUT', '/users/me'],
  ['GET', '/wallet'],
  ['GET', '/wallet/movements'],
  ['POST', '/wallet/topup'],
  ['POST', '/wallet/charge'],
  ['GET', '/cards'],
  ['POST', '/cards'],
]

const LIMITE_CUERPO = 10_000

function responder(res, estado, datos) {
  res.writeHead(estado, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(datos))
}

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    let texto = ''
    req.on('data', (parte) => {
      texto += parte
      if (texto.length > LIMITE_CUERPO) {
        reject(new Error('cuerpo_muy_grande'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(texto))
    req.on('error', reject)
  })
}

// Borrar un usuario en la API solo exige la clave del proyecto, asi que aqui se
// comprueba con el token de quien llama que unicamente borre su propia cuenta.
async function eliminarCuentaPropia(req, res) {
  const perfil = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { 'X-API-Key': API_TOKEN, Authorization: req.headers.authorization ?? '' },
  })
  if (!perfil.ok) {
    res.writeHead(perfil.status, { 'Content-Type': 'application/json' })
    return res.end(await perfil.text())
  }

  const { id } = await perfil.json()
  const respuesta = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: { 'X-API-Key': API_TOKEN },
  })
  res.writeHead(respuesta.status, { 'Content-Type': 'application/json' })
  res.end(await respuesta.text())
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (!url.pathname.startsWith('/api/')) {
    return responder(res, 404, { error: 'no_encontrado' })
  }

  const ruta = url.pathname.slice('/api'.length)
  if (req.method === 'DELETE' && ruta === '/users/me') {
    return eliminarCuentaPropia(req, res).catch(() => responder(res, 502, { error: 'api_no_disponible' }))
  }

  if (!PERMITIDAS.some(([m, p]) => m === req.method && p === ruta)) {
    return responder(res, 403, { error: 'ruta_no_permitida' })
  }

  try {
    const cuerpo = await leerCuerpo(req)
    const cabeceras = { 'X-API-Key': API_TOKEN }
    if (req.headers.authorization) cabeceras.Authorization = req.headers.authorization
    if (cuerpo) cabeceras['Content-Type'] = 'application/json'

    const respuesta = await fetch(API_BASE_URL + ruta + url.search, {
      method: req.method,
      headers: cabeceras,
      body: cuerpo || undefined,
    })
    const texto = await respuesta.text()
    res.writeHead(respuesta.status, { 'Content-Type': 'application/json' })
    res.end(texto)
  } catch (error) {
    if (error.message === 'cuerpo_muy_grande') return responder(res, 400, { error: error.message })
    responder(res, 502, { error: 'api_no_disponible' })
  }
})

// Solo escucha en tu propio computador (no en la red).
servidor.listen(PORT, '127.0.0.1', () => {
  console.log(`Servidor de la API en http://localhost:${PORT}`)
})
