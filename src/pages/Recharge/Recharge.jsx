import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSesion } from '../../context/sesion'
import { obtenerConfig, recargarSaldo } from '../../services/api'
import { mensajeError } from '../../services/errores'
import { pesos } from '../../utils/formato'
import styles from './Recharge.module.css'

const LIMITES_POR_DEFECTO = { montoMinimo: 100, montoMaximo: 500000, saldoMaximo: 2000000 }
const VALORES_RAPIDOS = [10000, 20000, 50000]
const MEDIOS = {
  pse: { titulo: 'PSE', detalle: 'Desde tu cuenta bancaria.', concepto: 'Recarga PSE' },
  tarjeta: { titulo: 'Tarjeta crédito o débito', detalle: 'Con tu tarjeta bancaria.', concepto: 'Recarga con tarjeta' },
}

function Recharge() {
  const { usuario, actualizarSaldo } = useSesion()
  const location = useLocation()
  const desde = location.state?.desde
  const [limites, setLimites] = useState(LIMITES_POR_DEFECTO)
  const [monto, setMonto] = useState(() => (location.state?.monto ? String(Math.max(location.state.monto, 100)) : ''))
  const [medio, setMedio] = useState('pse')
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    let activo = true
    // Si no responde se usan los límites conocidos: la API valida de todos modos.
    obtenerConfig()
      .then((config) => activo && setLimites(config.limites))
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  async function enviarRecarga(evento) {
    evento.preventDefault()
    if (enviando) return

    setEnviando(true)
    setAviso(null)
    try {
      const valor = Number(monto)
      const recarga = await recargarSaldo(valor, MEDIOS[medio].concepto)
      actualizarSaldo(recarga.saldo)
      setMonto('')
      setAviso({ exito: true, texto: `Recargaste ${pesos(valor)}. Tu saldo es ${pesos(recarga.saldo)}.` })
    } catch (error) {
      setAviso({ exito: false, texto: mensajeError(error) })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Recargar</h1>
        <p>Consulta tu saldo y elige cómo recargar.</p>
      </header>

      <section className={styles.card} aria-labelledby="tituloSaldo">
        <h2 id="tituloSaldo">Tu saldo</h2>
        <div className={styles.balance} aria-live="polite">
          <div>
            <span className={styles.balanceLabel}>Saldo disponible</span>
            <strong>{pesos(usuario.saldo)}</strong>
          </div>
          <span className={styles.balanceCurrency}>COP</span>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="tituloRecarga">
        <h2 id="tituloRecarga">Elige cómo recargar</h2>
        <p className={styles.securityNotice}>
          Recarga simulada: no se conecta a un banco ni se cobra dinero real.
        </p>

        <form onSubmit={enviarRecarga} aria-busy={enviando}>
          <label className={styles.amountLabel} htmlFor="monto">Valor de la recarga</label>
          <div className={styles.amountInput}>
            <span aria-hidden="true">$</span>
            <input
              id="monto"
              name="monto"
              type="number"
              min={limites.montoMinimo}
              max={limites.montoMaximo}
              step="100"
              required
              value={monto}
              onChange={(evento) => {
                setMonto(evento.target.value)
                setAviso(null)
              }}
              placeholder="0"
            />
            <span>COP</span>
          </div>

          <div className={styles.valoresRapidos}>
            {VALORES_RAPIDOS.map((valor) => (
              <button key={valor} type="button" onClick={() => setMonto(String(valor))}>
                {pesos(valor)}
              </button>
            ))}
          </div>

          <div className={styles.paymentOptions}>
            {Object.entries(MEDIOS).map(([id, opcion]) => (
              <label key={id} className={medio === id ? styles.optionSelected : styles.option}>
                <input
                  type="radio"
                  name="medio"
                  value={id}
                  checked={medio === id}
                  onChange={() => setMedio(id)}
                />
                <span>
                  <strong>{opcion.titulo}</strong>
                  <small>{opcion.detalle}</small>
                </span>
              </label>
            ))}
          </div>

          <button className={styles.primaryButton} type="submit" disabled={enviando}>
            {enviando ? 'Procesando…' : 'Recargar saldo'}
          </button>
          {aviso && (
            <p className={aviso.exito ? styles.notice : styles.error} role="status">{aviso.texto}</p>
          )}
          {aviso?.exito && desde && (
            <Link className={styles.volver} to={desde}>Volver a tu reserva</Link>
          )}
        </form>
      </section>
    </section>
  )
}

export default Recharge
