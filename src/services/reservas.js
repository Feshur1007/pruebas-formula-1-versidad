// La API no tiene rutas de reservas: se guardan en este navegador.
import { guardarLocal, leerLocal } from './almacen'

const CLAVE = 'parking-tunja:reservas'
// Tras reservar hay un margen para arrepentirse aunque la estadía ya haya empezado.
const MARGEN_REEMBOLSO = 10 * 60 * 1000

export const listarReservas = () => leerLocal(CLAVE, [])

export function reservasDeUsuario(usuarioId) {
  return listarReservas()
    .filter((reserva) => reserva.usuarioId === usuarioId)
    .sort((a, b) => b.creada - a.creada)
}

const seCruzan = (reserva, inicio, fin) => reserva.inicio < fin && inicio < reserva.fin
const estaVigente = (reserva, ahora) => !reserva.cancelada && reserva.fin > ahora

export function plazasReservadas(reservas, parqueaderoId, inicio, fin) {
  return new Set(
    reservas
      .filter((r) => r.parqueaderoId === parqueaderoId && !r.cancelada && seCruzan(r, inicio, fin))
      .map((r) => r.plazaId),
  )
}

export function placaOcupada(reservas, placa, inicio, fin) {
  return reservas.some((r) => r.placa === placa && !r.cancelada && seCruzan(r, inicio, fin))
}

export function contarReservasVigentes(reservas, parqueaderoId, ahora) {
  return reservas.filter((r) => r.parqueaderoId === parqueaderoId && estaVigente(r, ahora)).length
}

export function estadoReserva(reserva, ahora) {
  if (reserva.cancelada) return 'Cancelada'
  if (reserva.fin <= ahora) return 'Finalizada'
  return reserva.inicio > ahora ? 'Programada' : 'En curso'
}

export function montoReembolsable(reserva) {
  const ahora = Date.now()
  return ahora < reserva.inicio || ahora < reserva.creada + MARGEN_REEMBOLSO ? reserva.cobrado : 0
}

export function crearReserva(datos) {
  const reserva = { ...datos, id: crypto.randomUUID(), creada: Date.now(), cancelada: false }
  return guardarLocal(CLAVE, [...listarReservas(), reserva]) ? reserva : null
}

export function eliminarReserva(id) {
  guardarLocal(CLAVE, listarReservas().filter((reserva) => reserva.id !== id))
}

export function marcarCancelada(id) {
  guardarLocal(
    CLAVE,
    listarReservas().map((reserva) => (reserva.id === id ? { ...reserva, cancelada: true } : reserva)),
  )
}

export function eliminarReservasDeUsuario(usuarioId) {
  guardarLocal(CLAVE, listarReservas().filter((reserva) => reserva.usuarioId !== usuarioId))
}
