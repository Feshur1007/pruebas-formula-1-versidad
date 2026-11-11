import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useSesion } from '../../context/sesion'
import { mensajeError } from '../../services/errores'
import styles from './Login.module.css'

function Login() {
  const { usuario, cargando, entrar } = useSesion()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function enviarFormulario(evento) {
    evento.preventDefault()
    if (enviando) return

    setEnviando(true)
    setError('')
    try {
      await entrar(email, contrasena)
    } catch (errorLogin) {
      setError(mensajeError(errorLogin))
      setEnviando(false)
    }
  }

  if (!cargando && usuario) return <Navigate to={location.state?.desde ?? '/usuario'} replace />

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Inicio de sesión</h1>
        <p>Ingresa tus datos para acceder a tu cuenta.</p>
      </header>

      <div className={styles.panel}>
        <form className={styles.form} onSubmit={enviarFormulario} aria-busy={enviando}>
          <fieldset disabled={enviando}>
            <legend>Tus datos de acceso</legend>

            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="tu@correo.com"
            />

            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              name="contrasena"
              type="password"
              autoComplete="current-password"
              required
              value={contrasena}
              onChange={(evento) => setContrasena(evento.target.value)}
              placeholder="Ingresa tu contraseña"
            />
          </fieldset>

          <button className={styles.primaryButton} type="submit" disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
          {error && <p className={styles.notice} role="alert">{error}</p>}
          <p className={styles.alternativa}>
            ¿No tienes cuenta? <Link to="/registro" state={location.state}>Crea una aquí</Link>
          </p>
        </form>

        <aside className={styles.illustration} aria-label="Acceso seguro a Parking Tunja">
          <div className={styles.emblem} aria-hidden="true">
            <span />
          </div>
          <h2>Parking Tunja</h2>
          <p>Tu espacio para moverte con tranquilidad.</p>
        </aside>
      </div>
    </section>
  )
}

export default Login
