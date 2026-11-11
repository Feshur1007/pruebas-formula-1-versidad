import { pesos } from '../utils/formato'

const MENSAJES = {
  credenciales_invalidas: 'Correo o contraseña incorrectos.',
  usuario_inactivo: 'Tu cuenta está bloqueada.',
  email_en_uso: 'Ya existe una cuenta con ese correo. Inicia sesión.',
  email_invalido: 'Escribe un correo electrónico válido.',
  nombre_requerido: 'Escribe tu nombre completo.',
  cuota_agotada: 'El proyecto alcanzó su límite de usuarios registrados.',
  contrasena_actual_incorrecta: 'La contraseña actual no es correcta.',
  contrasena_debil: 'Contraseña débil: usa al menos 8 caracteres, que no sea común ni igual a tu correo.',
  monto_invalido: 'Escribe un valor entero mayor que cero.',
  supera_saldo_maximo: 'Esta recarga superaría el saldo máximo permitido.',
  sesion_caducada: 'Tu sesión terminó. Inicia sesión de nuevo.',
  no_es_tuyo: 'Esta cuenta se creó desde otro proyecto y no se puede eliminar aquí.',
  demasiadas_peticiones: 'Hay demasiadas peticiones en este momento. Espera un minuto.',
  clave_requerida: 'El servidor no tiene configurada la clave de la API.',
  clave_invalida: 'La clave de la API del servidor no es válida.',
  almacenamiento_no_disponible: 'El navegador no permite guardar los datos de prueba.',
}

const SIN_SERVICIO = 'No se pudo conectar con el servicio. Revisa que el servidor esté activo e inténtalo de nuevo.'

export function mensajeError(error) {
  const { message: codigo, datos } = error

  if (codigo === 'saldo_insuficiente') return `Saldo insuficiente: te faltan ${pesos(datos?.falta ?? 0)}.`
  if (codigo === 'monto_fuera_de_rango') {
    return `El valor debe estar entre ${pesos(datos?.minimo ?? 100)} y ${pesos(datos?.maximo ?? 500000)}.`
  }
  if (codigo === 'demasiados_intentos') {
    const minutos = Math.ceil((datos?.reintentar_en ?? 60) / 60)
    return `Demasiados intentos fallidos. Espera ${minutos} minuto(s) antes de volver a intentarlo.`
  }
  return MENSAJES[codigo] ?? SIN_SERVICIO
}
