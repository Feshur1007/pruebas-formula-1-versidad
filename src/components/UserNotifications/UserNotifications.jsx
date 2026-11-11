
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSesion } from '../../context/sesion'
import { useAhora } from '../../hooks/useAhora'
import { recargarSaldo } from '../../services/api'
import { mensajeError } from '../../services/errores'
import { guardarPreferencias, leerPreferencias } from '../../services/preferencias'
import {
  estadoReserva,
  listarReservas,
  marcarCancelada,
  montoReembolsable,
  reservasDeUsuario,
} from '../../services/reservas'
import { fechaHora, hora, pesos } from '../../utils/formato'
import styles from './UserNotifications.module.css'

const SALDO_BAJO = 5000

const TEXTOS = {
  Programada: (r) => `Tu reserva en ${r.parqueaderoNombre} empieza a las ${hora(r.inicio)}`,
  'En curso': (r) => `Tu reserva en ${r.parqueaderoNombre} está activa hasta las ${hora(r.fin)}`,
  Finalizada: (r) => `Tu reserva en ${r.parqueaderoNombre} finalizó.`,
  Cancelada: (r) => `Cancelaste tu reserva en ${r.parqueaderoNombre}.`,
}

function construirNotificaciones(reservas, saldo, ahora) {
  const notificaciones = reservas.slice(0, 5).map((reserva) => {
    const estado = estadoReserva(reserva, ahora)
    return { id: `${reserva.id}-${estado}`, mensaje: TEXTOS[estado](reserva) }
  })
  if (saldo < SALDO_BAJO) {
    notificaciones.unshift({ id: `saldo-bajo-${saldo}`, mensaje: `Tu saldo es bajo: ${pesos(saldo)}.` })
  }
  return notificaciones
}

function UserNotifications() {
  const { usuario, actualizarSaldo } = useSesion()
  const ahora = useAhora()
  const [reservas, setReservas] = useState(() => reservasDeUsuario(usuario.id))
  const [leidas, setLeidas] = useState(() => leerPreferencias(usuario.id).notificacionesLeidas)
  const [cancelando, setCancelando] = useState(null)
  const [error, setError] = useState('')

  const notificaciones = construirNotificaciones(reservas, usuario.saldo, ahora)

  function marcarTodoLeido() {
    const ids = notificaciones.map((item) => item.id)
    setLeidas(ids)
    guardarPreferencias(usuario.id, { notificacionesLeidas: ids })
  }

  async function cancelarReserva(reserva) {
    if (cancelando) return

    const reembolso = montoReembolsable(reserva)
    const aviso = reembolso > 0
      ? `Se te devolverán ${pesos(reembolso)} a tu saldo.`
      : 'Esta reserva ya no tiene reembolso.'
    if (!window.confirm(`¿Deseas cancelar tu reserva? ${aviso}`)) return

    setCancelando(reserva.id)
    setError('')
    try {
      // Otra pestaña pudo cancelarla mientras se confirmaba, y no debe reembolsarse dos veces.
      const actual = listarReservas().find((item) => item.id === reserva.id)
      if (actual && !actual.cancelada) {
        if (reembolso > 0) {
          const recarga = await recargarSaldo(reembolso, `Reembolso reserva ${reserva.plazaCodigo} · ${reserva.parqueaderoNombre}`)
          actualizarSaldo(recarga.saldo)
        }
        marcarCancelada(reserva.id)
      }
      setReservas(reservasDeUsuario(usuario.id))
    } catch (errorCancelar) {
      setError(mensajeError(errorCancelar))
    } finally {
      setCancelando(null)
    }
  }

  return (
    <section className={styles.container}>
      <h2>Notificaciones</h2>

      {notificaciones.length === 0 && <p>No tienes notificaciones.</p>}
      {notificaciones.map((item) => (
        <div key={item.id} className={styles.notification}>
          <p>{item.mensaje}</p>
          <span>{leidas.includes(item.id) ? 'Leída' : 'Nueva'}</span>
        </div>
      ))}
      {notificaciones.length > 0 && (
        <button type="button" className={styles.marcar} onClick={marcarTodoLeido}>
          Marcar todo como leído
        </button>
      )}

      <h3>Mis reservas</h3>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {reservas.length === 0 && (
        <p>No tienes reservas. <Link to="/mapa">Busca un parqueadero</Link>.</p>
      )}
      {reservas.map((reserva) => {
        const estado = estadoReserva(reserva, ahora)
        const cancelable = estado === 'Programada' || estado === 'En curso'

        return (
          <div key={reserva.id} className={styles.reservation}>
            <div>
              <p><strong>{reserva.parqueaderoNombre} · {reserva.plazaCodigo}</strong> <span>{estado}</span></p>
              <small>
                {reserva.placa} · {fechaHora(reserva.inicio)} a {hora(reserva.fin)} · {pesos(reserva.cobrado)}
              </small>
            </div>
            {cancelable && (
              <button type="button" onClick={() => cancelarReserva(reserva)} disabled={cancelando === reserva.id}>
                {cancelando === reserva.id ? 'Cancelando…' : 'Cancelar reserva'}
              </button>
            )}
          </div>
        )
      })}
    </section>
  )
}

export default UserNotifications
