import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSesion } from '../../context/sesion'
import { tiposVehiculo } from '../../data/vehiculos'
import { actualizarPerfil, cambiarContrasena } from '../../services/api'
import { mensajeError } from '../../services/errores'
import { guardarPreferencias, leerPreferencias } from '../../services/preferencias'
import styles from './UserAccount.module.css'

function UserAccount() {
  const { usuario, setUsuario, salir, eliminarCuenta } = useSesion()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState(usuario.nombre)
  const [cedula, setCedula] = useState(usuario.documento ?? '')
  const [vehiculo, setVehiculo] = useState(() => leerPreferencias(usuario.id).vehiculo)
  const [contrasenaActual, setContrasenaActual] = useState('')
  const [contrasenaNueva, setContrasenaNueva] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState(null)

  async function ejecutar(tarea, mensajeExito) {
    if (ocupado) return
    setOcupado(true)
    setAviso(null)
    try {
      await tarea()
      if (mensajeExito) setAviso({ exito: true, texto: mensajeExito })
    } catch (error) {
      setAviso({ exito: false, texto: mensajeError(error) })
    } finally {
      setOcupado(false)
    }
  }

  function guardarCambios(evento) {
    evento.preventDefault()
    ejecutar(async () => {
      setUsuario(await actualizarPerfil({ nombre: nombre.trim(), documento: cedula.trim() }))
      guardarPreferencias(usuario.id, { vehiculo })
    }, 'Los cambios se han guardado.')
  }

  function guardarContrasena(evento) {
    evento.preventDefault()
    ejecutar(async () => {
      setUsuario(await cambiarContrasena(contrasenaActual, contrasenaNueva))
      setContrasenaActual('')
      setContrasenaNueva('')
    }, 'Tu contraseña se actualizó.')
  }

  function cerrarSesion() {
    ejecutar(async () => {
      await salir()
      navigate('/')
    })
  }

  function borrarCuenta() {
    const confirmado = window.confirm(
      '¿Seguro que deseas eliminar tu cuenta? Se perderán tu saldo y tu historial, y no se puede deshacer.',
    )
    if (!confirmado) return

    // Al quedar sin sesión, RutaProtegida lleva a la página de inicio de sesión.
    ejecutar(() => eliminarCuenta(usuario.id))
  }

  return (
    <section className={styles.container}>
      <h2>Mi cuenta</h2>

      {aviso && (
        <p className={aviso.exito ? styles.exito : styles.error} role="status">{aviso.texto}</p>
      )}

      <form onSubmit={guardarCambios}>
        <label htmlFor="cuentaEmail">Correo electrónico</label>
        <input id="cuentaEmail" value={usuario.email} readOnly disabled />

        <label htmlFor="cuentaNombre">Nombre</label>
        <input
          id="cuentaNombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          minLength={2}
          maxLength={120}
        />

        <label htmlFor="cuentaCedula">Cédula</label>
        <input
          id="cuentaCedula"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          inputMode="numeric"
          pattern="[0-9]+"
          title="Ingresa tu cédula usando solo números."
          maxLength={15}
        />

        <label htmlFor="cuentaVehiculo">Tipo de vehículo</label>
        <select id="cuentaVehiculo" value={vehiculo} onChange={(e) => setVehiculo(e.target.value)}>
          <option value="">Sin definir</option>
          {tiposVehiculo.map((tipo) => <option key={tipo}>{tipo}</option>)}
        </select>

        <button type="submit" disabled={ocupado}>
          Guardar cambios
        </button>
      </form>

      <h3 className={styles.subtitulo}>Cambiar contraseña</h3>
      <form onSubmit={guardarContrasena}>
        <label htmlFor="contrasenaActual">Contraseña actual</label>
        <input
          id="contrasenaActual"
          type="password"
          autoComplete="current-password"
          value={contrasenaActual}
          onChange={(e) => setContrasenaActual(e.target.value)}
          required
        />

        <label htmlFor="contrasenaNueva">Nueva contraseña</label>
        <input
          id="contrasenaNueva"
          type="password"
          autoComplete="new-password"
          value={contrasenaNueva}
          onChange={(e) => setContrasenaNueva(e.target.value)}
          required
          minLength={8}
        />

        <button type="submit" disabled={ocupado}>
          Actualizar contraseña
        </button>
      </form>

      <div className={styles.actions}>
        <button type="button" onClick={cerrarSesion} disabled={ocupado}>
          Cerrar sesión
        </button>

        <button
          type="button"
          className={styles.delete}
          onClick={borrarCuenta}
          disabled={ocupado}
        >
          Eliminar cuenta
        </button>
      </div>
    </section>
  )
}

export default UserAccount
