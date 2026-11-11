import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  alCaducarSesion,
  CLAVE_SESION,
  cerrarSesionRemota,
  eliminarCuentaRemota,
  haySesionGuardada,
  iniciarSesion,
  obtenerPerfil,
  registrarUsuario,
} from '../services/api'
import { borrarPreferencias, guardarPreferencias } from '../services/preferencias'
import { eliminarReservasDeUsuario } from '../services/reservas'
import { SesionContext } from './sesion'

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(haySesionGuardada)

  useEffect(() => {
    alCaducarSesion(() => setUsuario(null))

    // Si se cierra la sesión en otra pestaña, esta también debe cerrarse.
    function sincronizar(evento) {
      if (evento.key === CLAVE_SESION && !evento.newValue) setUsuario(null)
    }
    window.addEventListener('storage', sincronizar)

    let activo = true
    if (haySesionGuardada()) {
      obtenerPerfil()
        .then((perfil) => activo && setUsuario(perfil))
        .catch(() => {})
        .finally(() => activo && setCargando(false))
    }

    return () => {
      activo = false
      window.removeEventListener('storage', sincronizar)
    }
  }, [])

  const entrar = useCallback(async (email, contrasena) => {
    setUsuario(await iniciarSesion(email, contrasena))
  }, [])

  const crearCuenta = useCallback(async ({ vehiculo, ...datos }) => {
    const nuevo = await registrarUsuario(datos)
    guardarPreferencias(nuevo.id, { vehiculo })
    setUsuario(nuevo)
  }, [])

  const salir = useCallback(async () => {
    setUsuario(null)
    await cerrarSesionRemota()
  }, [])

  const eliminarCuenta = useCallback(async (id) => {
    await eliminarCuentaRemota()
    borrarPreferencias(id)
    eliminarReservasDeUsuario(id)
    setUsuario(null)
  }, [])

  const actualizarSaldo = useCallback((saldo) => {
    setUsuario((actual) => (actual ? { ...actual, saldo } : actual))
  }, [])

  const valor = useMemo(
    () => ({ usuario, cargando, entrar, crearCuenta, salir, eliminarCuenta, actualizarSaldo, setUsuario }),
    [usuario, cargando, entrar, crearCuenta, salir, eliminarCuenta, actualizarSaldo],
  )

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
}
