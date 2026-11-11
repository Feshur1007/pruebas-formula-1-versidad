
import { useEffect, useState } from 'react'
import { useSesion } from '../../context/sesion'
import { obtenerMovimientos } from '../../services/api'
import { mensajeError } from '../../services/errores'
import { guardarPreferencias, leerPreferencias } from '../../services/preferencias'
import { fechaHora, pesos } from '../../utils/formato'
import styles from './UserTransactions.module.css'

const POR_PAGINA = 20
const SIGNOS = { recarga: '+', cobro: '−', pasaje: '−' }

function UserTransactions() {
  const { usuario } = useSesion()
  const [movimientos, setMovimientos] = useState([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ultimoLeido, setUltimoLeido] = useState(() => leerPreferencias(usuario.id).ultimoMovimientoLeido)

  useEffect(() => {
    let activo = true
    obtenerMovimientos({ limite: POR_PAGINA, desde: 0 })
      .then((pagina) => {
        if (!activo) return
        setMovimientos(pagina.movimientos)
        setTotal(pagina.total)
      })
      .catch((errorCarga) => activo && setError(mensajeError(errorCarga)))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [])

  async function cargarMas() {
    setCargando(true)
    setError('')
    try {
      const pagina = await obtenerMovimientos({ limite: POR_PAGINA, desde: movimientos.length })
      setMovimientos((actuales) => [...actuales, ...pagina.movimientos])
      setTotal(pagina.total)
    } catch (errorCarga) {
      setError(mensajeError(errorCarga))
    } finally {
      setCargando(false)
    }
  }

  function marcarTodoLeido() {
    const ultimo = movimientos[0]?.id ?? ultimoLeido
    setUltimoLeido(ultimo)
    guardarPreferencias(usuario.id, { ultimoMovimientoLeido: ultimo })
  }

  return (
    <section className={styles.container}>
      <h2>Transacciones</h2>

      <button type="button" onClick={marcarTodoLeido} disabled={movimientos.length === 0}>
        Marcar todo como leído
      </button>

      {error && <p role="alert">{error}</p>}
      {!cargando && !error && movimientos.length === 0 && <p>Aún no tienes movimientos.</p>}

      {movimientos.map((item) => (
        <div key={item.id} className={styles.transaction}>
          <div>
            <h3>{item.concepto ?? item.operacion}</h3>
            <p>{fechaHora(item.fecha)}</p>
            <strong>
              {SIGNOS[item.operacion] ?? ''}{pesos(item.monto)}
            </strong>
            <p>Saldo: {pesos(item.saldo)}</p>
          </div>

          <span>
            {item.id <= ultimoLeido ? 'Leída' : 'Nueva'}
          </span>
        </div>
      ))}

      {cargando && <p>Cargando…</p>}
      {!cargando && movimientos.length < total && (
        <button type="button" onClick={cargarMas}>Cargar más</button>
      )}
    </section>
  )
}

export default UserTransactions
