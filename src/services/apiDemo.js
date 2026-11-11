import { borrarLocal, guardarLocal, leerLocal } from './almacen'

const CLAVE_ESTADO = 'parking-tunja:demo'
const LIMITES = { montoMinimo: 100, montoMaximo: 500000, saldoMaximo: 2000000 }
const estadoInicial = () => ({ usuarios: [], movimientos: [], siguienteMovimiento: 1 })

function leerEstado() {
  return leerLocal(CLAVE_ESTADO, estadoInicial())
}

function guardarEstado(estado) {
  if (!guardarLocal(CLAVE_ESTADO, estado)) {
    throw crearError('almacenamiento_no_disponible', 0)
  }
}

function crearError(codigo, estado = 400, datos) {
  const error = new Error(codigo)
  error.estado = estado
  error.datos = datos
  return error
}

function usuarioPublico(usuario) {
  const publico = { ...usuario }
  delete publico.contrasena
  delete publico.acceso
  delete publico.refresco
  return publico
}

function crearTokens() {
  return { acceso: crypto.randomUUID(), refresco: crypto.randomUUID() }
}

function usuarioPorAcceso(estado, acceso) {
  const usuario = estado.usuarios.find((item) => item.acceso === acceso)
  if (!usuario) throw crearError('sesion_caducada', 401)
  return usuario
}

function registrarMovimiento(estado, usuario, operacion, monto, concepto) {
  const movimiento = {
    id: estado.siguienteMovimiento,
    usuarioId: usuario.id,
    operacion,
    monto,
    saldo: usuario.saldo,
    concepto,
    fecha: new Date().toISOString(),
  }
  estado.siguienteMovimiento += 1
  estado.movimientos.unshift(movimiento)
}

export async function obtenerConfigDemo() {
  return { limites: LIMITES }
}

export async function verificarClaveDemo() {
  return { valida: true, prefijo: 'DEMO' }
}

export function registrarUsuarioDemo({ email, contrasena, nombre, documento }) {
  const estado = leerEstado()
  const correo = email.trim().toLowerCase()
  if (!correo || !correo.includes('@')) throw crearError('email_invalido')
  if (!nombre?.trim()) throw crearError('nombre_requerido')
  if (contrasena.length < 8) throw crearError('contrasena_debil')
  if (estado.usuarios.some((item) => item.email === correo)) throw crearError('email_en_uso', 409)

  const tokens = crearTokens()
  const usuario = {
    id: crypto.randomUUID(),
    email: correo,
    nombre: nombre.trim(),
    documento,
    saldo: 0,
    contrasena,
    ...tokens,
  }
  estado.usuarios.push(usuario)
  guardarEstado(estado)
  return { ...tokens, usuario: usuarioPublico(usuario) }
}

export function iniciarSesionDemo(email, contrasena) {
  const estado = leerEstado()
  const usuario = estado.usuarios.find((item) => item.email === email.trim().toLowerCase())
  if (!usuario || usuario.contrasena !== contrasena) {
    throw crearError('credenciales_invalidas', 401)
  }
  const tokens = crearTokens()
  Object.assign(usuario, tokens)
  guardarEstado(estado)
  return { ...tokens, usuario: usuarioPublico(usuario) }
}

export function cerrarSesionDemo(refresco) {
  const estado = leerEstado()
  const usuario = estado.usuarios.find((item) => item.refresco === refresco)
  if (usuario) {
    delete usuario.acceso
    delete usuario.refresco
    guardarEstado(estado)
  }
}

export function obtenerPerfilDemo(acceso) {
  return usuarioPublico(usuarioPorAcceso(leerEstado(), acceso))
}

export function actualizarPerfilDemo(acceso, cambios) {
  const estado = leerEstado()
  const usuario = usuarioPorAcceso(estado, acceso)
  if (cambios.nombre !== undefined) usuario.nombre = cambios.nombre
  if (cambios.documento !== undefined) usuario.documento = cambios.documento
  guardarEstado(estado)
  return usuarioPublico(usuario)
}

export function cambiarContrasenaDemo(acceso, actual, nueva) {
  const estado = leerEstado()
  const usuario = usuarioPorAcceso(estado, acceso)
  if (usuario.contrasena !== actual) throw crearError('contrasena_actual_incorrecta', 401)
  if (nueva.length < 8 || nueva.toLowerCase() === usuario.email) {
    throw crearError('contrasena_debil')
  }
  usuario.contrasena = nueva
  const tokens = crearTokens()
  Object.assign(usuario, tokens)
  guardarEstado(estado)
  return { ...tokens, usuario: usuarioPublico(usuario) }
}

export function eliminarCuentaDemo(acceso) {
  const estado = leerEstado()
  const usuario = usuarioPorAcceso(estado, acceso)
  estado.usuarios = estado.usuarios.filter((item) => item.id !== usuario.id)
  estado.movimientos = estado.movimientos.filter((item) => item.usuarioId !== usuario.id)
  guardarEstado(estado)
}

export function obtenerBilleteraDemo(acceso) {
  return { saldo: usuarioPorAcceso(leerEstado(), acceso).saldo }
}

export function obtenerMovimientosDemo(acceso, { limite = 20, desde = 0 } = {}) {
  const estado = leerEstado()
  const usuario = usuarioPorAcceso(estado, acceso)
  const movimientos = estado.movimientos.filter((item) => item.usuarioId === usuario.id)
  return {
    movimientos: movimientos.slice(desde, desde + limite),
    total: movimientos.length,
  }
}

function actualizarSaldoDemo(acceso, monto, concepto, operacion) {
  const estado = leerEstado()
  const usuario = usuarioPorAcceso(estado, acceso)
  if (!Number.isInteger(monto) || monto <= 0) throw crearError('monto_invalido')

  if (operacion === 'recarga') {
    if (monto < LIMITES.montoMinimo || monto > LIMITES.montoMaximo) {
      throw crearError('monto_fuera_de_rango', 400, {
        minimo: LIMITES.montoMinimo,
        maximo: LIMITES.montoMaximo,
      })
    }
    if (usuario.saldo + monto > LIMITES.saldoMaximo) {
      throw crearError('supera_saldo_maximo')
    }
    usuario.saldo += monto
  } else {
    if (monto > usuario.saldo) {
      throw crearError('saldo_insuficiente', 400, {
        saldo: usuario.saldo,
        falta: monto - usuario.saldo,
      })
    }
    usuario.saldo -= monto
  }

  registrarMovimiento(estado, usuario, operacion === 'recarga' ? 'recarga' : 'cobro', monto, concepto)
  guardarEstado(estado)
  return { saldo: usuario.saldo }
}

export const recargarSaldoDemo = (acceso, monto, concepto) =>
  actualizarSaldoDemo(acceso, monto, concepto, 'recarga')

export const cobrarReservaDemo = (acceso, monto, concepto) =>
  actualizarSaldoDemo(acceso, monto, concepto, 'cobro')

export function borrarDatosDemo() {
  borrarLocal(CLAVE_ESTADO)
}
