import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ParkingInfo from '../../components/ParkingInfo/ParkingInfo'
import ParkingSpaces from '../../components/ParkingSpaces/ParkingSpaces'
import ReservationForm from '../../components/ReservationForm/ReservationForm'
import ReservationSummary from '../../components/ReservationSummary/ReservationSummary'
import { useSesion } from '../../context/sesion'
import { cuposLibres, generarPlazas } from '../../data/plazas'
import { parqueaderos } from '../../data/parqueaderos'
import { useAhora } from '../../hooks/useAhora'
import { cobrarReserva } from '../../services/api'
import { mensajeError } from '../../services/errores'
import { guardarPreferencias, leerPreferencias } from '../../services/preferencias'
import {
  crearReserva,
  eliminarReserva,
  listarReservas,
  placaOcupada,
  plazasReservadas,
} from '../../services/reservas'
import { fechaHora, hora, pesos } from '../../utils/formato'
import styles from './Reservation.module.css'

const HORA = 60 * 60 * 1000
// La API no acepta cobros por debajo de este valor.
const COBRO_MINIMO = 100
const FORMATO_PLACA = /^[A-Z]{3} ?(\d{3}|\d{2}[A-Z])$/

function ReservaParqueadero({ parqueadero }) {
  const navigate = useNavigate()
  const { usuario, actualizarSaldo } = useSesion()
  const ahora = useAhora()

  const [plazaSeleccionada, setPlazaSeleccionada] = useState(null)
  const [tiempoEspera, setTiempoEspera] = useState(0)
  const [duracion, setDuracion] = useState(2)
  const [placa, setPlaca] = useState(() => (usuario ? leerPreferencias(usuario.id).placa : ''))
  const [reservas, setReservas] = useState(listarReservas)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const [confirmada, setConfirmada] = useState(null)
  const enCurso = useRef(false)

  const inicio = ahora + tiempoEspera * HORA
  const fin = inicio + duracion * HORA
  const plazas = generarPlazas(parqueadero, plazasReservadas(reservas, parqueadero.id, inicio, fin))
  const plaza = plazas.find((item) => item.id === plazaSeleccionada && item.estado === 'Disponible') ?? null

  const placaNormalizada = placa.trim()
  const placaValida = FORMATO_PLACA.test(placaNormalizada)
  const descuento = usuario?.descuento ?? 0
  const subtotal = duracion * parqueadero.tarifaHora
  const total = Math.round(subtotal * (1 - descuento / 100))

  function alCambiar(setter) {
    return (valor) => {
      setter(valor)
      setError('')
    }
  }

  async function confirmarReserva() {
    if (enCurso.current || !usuario || !plaza || !placaValida) return

    // Se recalcula con la hora y las reservas de este instante, no las de la pantalla.
    const inicioReal = Date.now() + tiempoEspera * HORA
    const finReal = inicioReal + duracion * HORA
    const vigentes = listarReservas()
    setReservas(vigentes)

    if (plazasReservadas(vigentes, parqueadero.id, inicioReal, finReal).has(plaza.id)) {
      setError('Esa plaza acaba de ser reservada. Elige otra.')
      return
    }
    if (placaOcupada(vigentes, placaNormalizada, inicioReal, finReal)) {
      setError('Esta placa ya tiene una reserva en ese horario.')
      return
    }

    enCurso.current = true
    setProcesando(true)
    setError('')

    const cobrado = total >= COBRO_MINIMO ? total : 0
    // Se guarda antes de cobrar para apartar la plaza y no cobrar sin dejar registro.
    const reserva = crearReserva({
      usuarioId: usuario.id,
      parqueaderoId: parqueadero.id,
      parqueaderoNombre: parqueadero.nombre,
      plazaId: plaza.id,
      plazaCodigo: plaza.codigo,
      placa: placaNormalizada,
      inicio: inicioReal,
      fin: finReal,
      cobrado,
    })

    if (!reserva) {
      setError('No se pudo guardar la reserva en este navegador.')
    } else {
      try {
        if (cobrado > 0) {
          const cobro = await cobrarReserva(cobrado, `Reserva ${plaza.codigo} · ${parqueadero.nombre}`)
          actualizarSaldo(cobro.saldo)
        }
        guardarPreferencias(usuario.id, { placa: placaNormalizada })
        setConfirmada(reserva)
      } catch (errorCobro) {
        eliminarReserva(reserva.id)
        if (errorCobro.message === 'saldo_insuficiente') actualizarSaldo(errorCobro.datos.saldo)
        setError(mensajeError(errorCobro))
      }
    }

    setReservas(listarReservas())
    setProcesando(false)
    enCurso.current = false
  }

  function reservarOtra() {
    setConfirmada(null)
    setPlazaSeleccionada(null)
  }

  if (confirmada) {
    return (
      <section className={styles.confirmacion} role="status">
        <h2>¡Reserva confirmada!</h2>
        <dl>
          <div><dt>Parqueadero</dt><dd>{confirmada.parqueaderoNombre}</dd></div>
          <div><dt>Plaza</dt><dd>{confirmada.plazaCodigo}</dd></div>
          <div><dt>Placa</dt><dd>{confirmada.placa}</dd></div>
          <div><dt>Desde</dt><dd>{fechaHora(confirmada.inicio)}</dd></div>
          <div><dt>Hasta</dt><dd>{fechaHora(confirmada.fin)}</dd></div>
          <div><dt>Pagado</dt><dd>{pesos(confirmada.cobrado)}</dd></div>
          <div><dt>Saldo restante</dt><dd>{pesos(usuario?.saldo ?? 0)}</dd></div>
        </dl>
        <div className={styles.acciones}>
          <Link to="/usuario" className={styles.accionPrincipal}>Ver mis reservas</Link>
          <button type="button" className={styles.accionSecundaria} onClick={reservarOtra}>Hacer otra reserva</button>
        </div>
      </section>
    )
  }

  return (
    <>
      <ParkingInfo
        parqueadero={parqueadero}
        libres={cuposLibres(parqueadero, reservas, ahora)}
        total={parqueadero.capacidad}
      />

      <div className={styles.layout}>
        <div className={styles.formColumn}>
          <ParkingSpaces
            plazas={plazas}
            plazaSeleccionada={plaza?.id ?? null}
            onSelect={alCambiar(setPlazaSeleccionada)}
          />
          <ReservationForm
            tiempoEspera={tiempoEspera}
            setTiempoEspera={alCambiar(setTiempoEspera)}
            duracion={duracion}
            setDuracion={alCambiar(setDuracion)}
            placa={placa}
            setPlaca={alCambiar(setPlaca)}
            placaValida={placaValida}
            horaInicio={hora(inicio)}
            horaFin={hora(fin)}
          />
        </div>

        <ReservationSummary
          parqueadero={parqueadero}
          plaza={plaza}
          placa={placaNormalizada}
          placaValida={placaValida}
          tiempoEspera={tiempoEspera}
          duracion={duracion}
          horaInicio={hora(inicio)}
          horaFin={hora(fin)}
          descuento={descuento}
          total={total}
          usuario={usuario}
          procesando={procesando}
          error={error}
          onConfirm={confirmarReserva}
          onCancel={() => navigate('/mapa')}
        />
      </div>
    </>
  )
}

function Reservation() {
  const { parqueaderoId } = useParams()
  const navigate = useNavigate()
  const { usuario, cargando } = useSesion()
  const parqueadero = parqueaderoId === undefined
    ? parqueaderos[0]
    : parqueaderos.find((item) => item.id === Number(parqueaderoId))

  return (
    <div className={styles.page}>
      <Link to="/mapa" className={styles.back}>← Volver al mapa</Link>
      <header className={styles.pageHeader}>
        <h1>Reservar una plaza</h1>
        <p>Selecciona una plaza, define el tiempo y revisa tu reserva.</p>
      </header>

      {!parqueadero && <p>Ese parqueadero no existe. <Link to="/mapa">Elige uno en el mapa</Link>.</p>}

      {parqueadero && (
        <>
          <label className={styles.selectorParqueadero}>
            Parqueadero
            <select value={parqueadero.id} onChange={(evento) => navigate(`/reservas/${evento.target.value}`)}>
              {parqueaderos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </label>

          {cargando
            ? <p>Cargando…</p>
            : <ReservaParqueadero key={`${parqueadero.id}-${usuario?.id ?? 'anonimo'}`} parqueadero={parqueadero} />}
        </>
      )}
    </div>
  )
}

export default Reservation
