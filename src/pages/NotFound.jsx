import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section style={{ padding: '32px' }}>
      <h1>Página no encontrada</h1>
      <Link to="/">Volver al inicio</Link>
    </section>
  )
}

export default NotFound
