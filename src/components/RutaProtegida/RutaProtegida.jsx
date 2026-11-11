import { Navigate, useLocation } from 'react-router-dom'
import { useSesion } from '../../context/sesion'

function RutaProtegida({ children }) {
  const { usuario, cargando } = useSesion()
  const location = useLocation()

  if (cargando) return <p style={{ padding: 32, textAlign: 'center' }}>Cargando…</p>
  if (!usuario) return <Navigate to="/inicio-sesion" replace state={{ desde: location.pathname }} />
  return children
}

export default RutaProtegida
