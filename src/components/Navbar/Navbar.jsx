
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useSesion } from '../../context/sesion'
import { pesos } from '../../utils/formato'
import styles from './Navbar.module.css'

function Navbar() {
  const { usuario, cargando, salir } = useSesion()
  const navigate = useNavigate()

  async function cerrarSesion() {
    await salir()
    navigate('/')
  }

  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <Link to="/" className={styles.brand}>
          PARKING TUNJA
        </Link>

        <div className={styles.links}>
          <NavLink to="/" end>
            Inicio
          </NavLink>

          <NavLink to="/mapa">
            Mapa
          </NavLink>

          <NavLink to="/reservas">
            Reservar
          </NavLink>

          {usuario && (
            <>
              <NavLink to="/usuario">
                {usuario.nombre.split(' ')[0]}
              </NavLink>

              <NavLink to="/recarga" className={styles.saldo}>
                Saldo {pesos(usuario.saldo)}
              </NavLink>

              <button type="button" className={styles.salir} onClick={cerrarSesion}>
                Salir
              </button>
            </>
          )}

          {!usuario && !cargando && (
            <>
              <NavLink to="/inicio-sesion">
                Iniciar sesión
              </NavLink>

              <NavLink to="/registro">
                Crear cuenta
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
