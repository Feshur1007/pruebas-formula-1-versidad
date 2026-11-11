import { Link, useLocation } from 'react-router-dom'
import { pesos } from '../../utils/formato'
import PaymentMethod from '../PaymentMethod/PaymentMethod'
import styles from './ReservationSummary.module.css'

function ReservationSummary({
  parqueadero,
  plaza,
  placa,
  placaValida,
  tiempoEspera,
  duracion,
  horaInicio,
  horaFin,
  descuento,
  total,
  usuario,
  procesando,
  error,
  onConfirm,
  onCancel,
}) {
  const location = useLocation()
  const saldoSuficiente = Boolean(usuario) && usuario.saldo >= total
  const puedeConfirmar = Boolean(plaza) && placaValida && saldoSuficiente && !procesando

  return (
    <aside className={styles.container}>
      <section className={styles.summary}>
        <h2>3. Resumen de reserva</h2>
        <dl>
          <div>
            <dt>Parqueadero</dt>
            <dd>{parqueadero.nombre}</dd>
          </div>
          <div>
            <dt>Plaza seleccionada</dt>
            <dd>{plaza ? plaza.nombre : 'Ninguna'}</dd>
          </div>
          <div>
            <dt>Placa</dt>
            <dd>{placa || 'Sin escribir'}</dd>
          </div>
          <div>
            <dt>Tiempo de espera</dt>
            <dd>{tiempoEspera === 0 ? 'Sin espera' : `${tiempoEspera} hora(s)`}</dd>
          </div>
          <div>
            <dt>Tiempo de estadía</dt>
            <dd>{duracion} hora(s)</dd>
          </div>
          <div>
            <dt>Horario estimado</dt>
            <dd>{horaInicio} - {horaFin}</dd>
          </div>
          <div>
            <dt>Tarifa por hora</dt>
            <dd>{pesos(parqueadero.tarifaHora)}</dd>
          </div>
          {descuento > 0 && (
            <div>
              <dt>Descuento</dt>
              <dd>{descuento}%</dd>
            </div>
          )}
        </dl>
        <div className={styles.total}>
          <strong>Total a pagar</strong>
          <strong className={styles.amount}>{pesos(total)}</strong>
        </div>
      </section>

      <section className={styles.summary}>
        <PaymentMethod usuario={usuario} total={total} rutaActual={location.pathname} />
      </section>

      {usuario ? (
        <button className={styles.confirmButton} type="button" onClick={onConfirm} disabled={!puedeConfirmar}>
          {procesando ? 'Procesando pago…' : 'Pagar y confirmar reserva'}
        </button>
      ) : (
        <Link className={styles.confirmButton} to="/inicio-sesion" state={{ desde: location.pathname }}>
          Inicia sesión para reservar
        </Link>
      )}
      <button className={styles.cancelButton} type="button" onClick={onCancel} disabled={procesando}>
        Cancelar
      </button>

      {!plaza && <p className={styles.validation}>Selecciona una plaza disponible para continuar.</p>}
      {plaza && !placaValida && (
        <p className={styles.validation}>Escribe una placa válida, por ejemplo ABC 123 o ABC 12D.</p>
      )}
      {error && <p className={styles.validation} role="alert">{error}</p>}
    </aside>
  )
}

export default ReservationSummary
