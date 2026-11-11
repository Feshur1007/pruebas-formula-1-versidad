import { borrarLocal, guardarLocal, leerLocal } from './almacen'

// Datos propios de Parking Tunja que la API no guarda.
const clave = (usuarioId) => `parking-tunja:preferencias:${usuarioId}`

export function leerPreferencias(usuarioId) {
  return {
    vehiculo: '',
    placa: '',
    notificacionesLeidas: [],
    ultimoMovimientoLeido: 0,
    ...leerLocal(clave(usuarioId), {}),
  }
}

export function guardarPreferencias(usuarioId, cambios) {
  guardarLocal(clave(usuarioId), { ...leerPreferencias(usuarioId), ...cambios })
}

export const borrarPreferencias = (usuarioId) => borrarLocal(clave(usuarioId))
