import { Link } from 'react-router-dom'
import { useSesion } from '../context/sesion'
import { cuposLibres } from '../data/plazas'
import { parqueaderos } from '../data/parqueaderos'
import { useAhora } from '../hooks/useAhora'
import { estadoReserva, listarReservas, reservasDeUsuario } from '../services/reservas'
import { fechaHora, pesos } from '../utils/formato'
import styles from './Home.module.css'

function PanelUsuario({ usuario, ahora }) {
  const vigente = reservasDeUsuario(usuario.id)
    .filter((reserva) => ['Programada', 'En curso'].includes(estadoReserva(reserva, ahora)))
    .sort((a, b) => a.inicio - b.inicio)[0]

  return (
    <section className={styles.resumen}>
      <div className={styles.dato}>
        <span>Tu saldo</span>
        <strong>{pesos(usuario.saldo)}</strong>
        <Link to="/recarga">Recargar</Link>
      </div>
      <div className={styles.dato}>
        <span>Próxima reserva</span>
        {vigente ? (
          <>
            <strong>{vigente.parqueaderoNombre} · {vigente.plazaCodigo}</strong>
            <small>{fechaHora(vigente.inicio)}</small>
          </>
        ) : (
          <strong>Sin reservas vigentes</strong>
        )}
        <Link to="/usuario">Ver mis reservas</Link>
      </div>
    </section>
  )
}

function Home() {
  const { usuario } = useSesion()
  const ahora = useAhora()
  const reservas = listarReservas()

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <h1>{usuario ? `Hola, ${usuario.nombre.split(' ')[0]}` : 'Parking Tunja'}</h1>
        <p>Encuentra un parqueadero, reserva tu plaza y paga con tu saldo.</p>
        <div className={styles.acciones}>
          <Link to="/mapa" className={styles.principal}>Ver el mapa</Link>
          {!usuario && <Link to="/registro" className={styles.secundaria}>Crear cuenta</Link>}
        </div>
      </section>

      {usuario && <PanelUsuario usuario={usuario} ahora={ahora} />}

      <section>
        <h2>Parqueaderos</h2>
        <div className={styles.lista}>
          {parqueaderos.map((parqueadero) => {
            const cupos = cuposLibres(parqueadero, reservas, ahora)

            return (
              <article key={parqueadero.id} className={styles.tarjeta}>
                <h3>{parqueadero.nombre}</h3>
                <p>{parqueadero.direccion} · Tunja</p>
                <p><strong>{pesos(parqueadero.tarifaHora)}</strong> / hora</p>
                <p className={cupos > 0 ? styles.conCupos : styles.sinCupos}>
                  {cupos > 0 ? `${cupos} cupos disponibles` : 'Sin cupos'}
                </p>
                {cupos > 0 && <Link to={`/reservas/${parqueadero.id}`}>Reservar</Link>}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default Home
