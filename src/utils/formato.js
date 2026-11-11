export const pesos = (valor) => `$${valor.toLocaleString('es-CO')}`

export const hora = (fecha) =>
  new Date(fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })

export const fechaHora = (fecha) =>
  new Date(fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short', hour12: true })
