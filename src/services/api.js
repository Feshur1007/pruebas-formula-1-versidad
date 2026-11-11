// Peticiones a la API. React nunca ve la clave: llama a /api y el
// servidor (server/index.js) la agrega.
import { borrarLocal, guardarLocal, leerLocal } from './almacen'
import * as demo from './apiDemo'

export const CLAVE_SESION = 'parking-tunja:sesion'
const modoDemo = import.meta.env.MODE === 'demo' || import.meta.env.VITE_DEMO_MODE === 'true'

const leerSesion = () => leerLocal(CLAVE_SESION, null)
export const haySesionGuardada = () => Boolean(leerSesion()?.acceso)
export const borrarSesion = () => borrarLocal(CLAVE_SESION)

function guardarTokens({ acceso, refresco }) {
  guardarLocal(CLAVE_SESION, { acceso, refresco })
}

let avisarSesionCaducada = () => {}
export function alCaducarSesion(funcion) {
  avisarSesionCaducada = funcion
}

function crearError(codigo, estado, datos) {
  const error = new Error(codigo)
  error.estado = estado
  error.datos = datos
  return error
}

async function pedir(ruta, { metodo = 'GET', cuerpo, acceso } = {}) {
  const cabeceras = {}
  if (cuerpo) cabeceras['Content-Type'] = 'application/json'
  if (acceso) cabeceras.Authorization = `Bearer ${acceso}`

  let respuesta
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw crearError('sin_conexion', 0)
  }

  const datos = respuesta.status === 204 ? null : await respuesta.json().catch(() => null)
  if (!respuesta.ok) throw crearError(datos?.error ?? 'error_desconocido', respuesta.status, datos)
  return datos
}

function caducarSesion() {
  borrarSesion()
  avisarSesionCaducada()
  return crearError('sesion_caducada', 401)
}

function conBloqueoEntrePestanas(tarea) {
  if (!navigator.locks) return tarea()
  return navigator.locks.request('parking-tunja:refresco', tarea)
}

// Cada refresco sirve una sola vez y reutilizarlo cierra todas las sesiones del
// usuario, así que solo puede haber una renovación a la vez, incluso entre pestañas.
let renovacionEnCurso = null

function renovarAcceso(accesoRechazado) {
  renovacionEnCurso ??= conBloqueoEntrePestanas(async () => {
    const sesion = leerSesion()
    if (!sesion?.refresco) throw caducarSesion()
    if (sesion.acceso !== accesoRechazado) return sesion.acceso

    try {
      const par = await pedir('/auth/refresh', { metodo: 'POST', cuerpo: { refresco: sesion.refresco } })
      guardarTokens(par)
      return par.acceso
    } catch (error) {
      // Un fallo de red no invalida la sesión; un refresco rechazado sí.
      if (error.estado === 401) throw caducarSesion()
      throw error
    }
  }).finally(() => {
    renovacionEnCurso = null
  })
  return renovacionEnCurso
}

const TOKENS_NO_RENOVABLES = ['token_requerido', 'token_invalido', 'token_caducado_por_cambio']

async function pedirConSesion(ruta, opciones = {}) {
  const sesion = leerSesion()
  if (!sesion?.acceso) throw caducarSesion()

  try {
    return await pedir(ruta, { ...opciones, acceso: sesion.acceso })
  } catch (error) {
    if (TOKENS_NO_RENOVABLES.includes(error.message)) throw caducarSesion()
    if (error.message !== 'token_expirado') throw error

    // La API rechaza el token antes de ejecutar nada: reintentar no cobra dos veces.
    const acceso = await renovarAcceso(sesion.acceso)
    return pedir(ruta, { ...opciones, acceso })
  }
}

// GET sin sesion: sirve para probar la conexion y leer los limites vigentes.
export const obtenerConfig = async () => (modoDemo ? demo.obtenerConfigDemo() : pedir('/config'))
// GET que confirma que la clave funciona (devuelve solo el prefijo, no la clave).
export const verificarClave = async () => (modoDemo ? demo.verificarClaveDemo() : pedir('/key'))

export async function iniciarSesion(email, contrasena) {
  if (modoDemo) {
    const respuesta = demo.iniciarSesionDemo(email, contrasena)
    guardarTokens(respuesta)
    return respuesta.usuario
  }
  const respuesta = await pedir('/auth/login', { metodo: 'POST', cuerpo: { email, contrasena } })
  guardarTokens(respuesta)
  return respuesta.usuario
}

export async function registrarUsuario({ email, contrasena, nombre, documento }) {
  if (modoDemo) {
    const respuesta = demo.registrarUsuarioDemo({ email, contrasena, nombre, documento })
    guardarTokens(respuesta)
    return respuesta.usuario
  }
  const respuesta = await pedir('/auth/register', {
    metodo: 'POST',
    cuerpo: { email, contrasena, nombre, documento },
  })
  guardarTokens(respuesta)
  return respuesta.usuario
}

export async function cerrarSesionRemota() {
  const refresco = leerSesion()?.refresco
  borrarSesion()
  if (!refresco) return
  if (modoDemo) return demo.cerrarSesionDemo(refresco)
  // Si falla, la sesión ya quedó cerrada en este navegador.
  await pedir('/auth/logout', { metodo: 'POST', cuerpo: { refresco } }).catch(() => {})
}

export const obtenerPerfil = async () =>
  modoDemo ? demo.obtenerPerfilDemo(leerSesion()?.acceso) : pedirConSesion('/auth/me')

export const actualizarPerfil = async (cambios) =>
  modoDemo
    ? demo.actualizarPerfilDemo(leerSesion()?.acceso, cambios)
    : pedirConSesion('/users/me', { metodo: 'PUT', cuerpo: cambios })

export async function cambiarContrasena(actual, nueva) {
  if (modoDemo) {
    const respuesta = demo.cambiarContrasenaDemo(leerSesion()?.acceso, actual, nueva)
    guardarTokens(respuesta)
    return respuesta.usuario
  }
  const respuesta = await pedirConSesion('/auth/password', { metodo: 'POST', cuerpo: { actual, nueva } })
  guardarTokens(respuesta)
  return respuesta.usuario
}

export async function eliminarCuentaRemota() {
  if (modoDemo) {
    demo.eliminarCuentaDemo(leerSesion()?.acceso)
    borrarSesion()
    return
  }
  await pedirConSesion('/users/me', { metodo: 'DELETE' })
  borrarSesion()
}

export const obtenerBilletera = async () =>
  modoDemo ? demo.obtenerBilleteraDemo(leerSesion()?.acceso) : pedirConSesion('/wallet')

export const obtenerMovimientos = async ({ limite = 20, desde = 0 } = {}) =>
  modoDemo
    ? demo.obtenerMovimientosDemo(leerSesion()?.acceso, { limite, desde })
    : pedirConSesion(`/wallet/movements?limite=${limite}&desde=${desde}`)

export const recargarSaldo = async (monto, concepto) =>
  modoDemo
    ? demo.recargarSaldoDemo(leerSesion()?.acceso, monto, concepto)
    : pedirConSesion('/wallet/topup', { metodo: 'POST', cuerpo: { monto, concepto } })

export const cobrarReserva = async (monto, concepto) =>
  modoDemo
    ? demo.cobrarReservaDemo(leerSesion()?.acceso, monto, concepto)
    : pedirConSesion('/wallet/charge', { metodo: 'POST', cuerpo: { monto, concepto } })
