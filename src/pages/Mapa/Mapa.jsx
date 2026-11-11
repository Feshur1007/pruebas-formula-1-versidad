import { useState } from 'react'
import MapaParqueaderos from '../../components/MapaParqueaderos/MapaParqueaderos'
import PanelDisponibles from '../../components/PanelDisponibles/PanelDisponibles'
import { cuposLibres } from '../../data/plazas'
import { parqueaderos } from '../../data/parqueaderos'
import { useAhora } from '../../hooks/useAhora'
import { listarReservas } from '../../services/reservas'
import { distanciaKm } from '../../utils/distancia'
import styles from './Mapa.module.css'

const FILTROS_INICIALES = { texto: '', tarifaMaxima: '', soloConCupos: true, orden: 'precio' }

const COMPARADORES = {
  precio: (a, b) => a.tarifaHora - b.tarifaHora,
  cupos: (a, b) => b.cupos - a.cupos,
  distancia: (a, b) => a.distancia - b.distancia,
}

function Mapa() {
  const ahora = useAhora()
  const [panelAbierto, setPanelAbierto] = useState(() => window.innerWidth >= 640)
  const [seleccionadoId, setSeleccionadoId] = useState(null)
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [ubicacion, setUbicacion] = useState(null)
  const [estadoUbicacion, setEstadoUbicacion] = useState('')

  const reservas = listarReservas()
  const texto = filtros.texto.trim().toLowerCase()
  const visibles = parqueaderos
    .map((parqueadero) => ({
      ...parqueadero,
      cupos: cuposLibres(parqueadero, reservas, ahora),
      distancia: ubicacion ? distanciaKm(ubicacion, parqueadero) : null,
    }))
    .filter((parqueadero) => (
      (!texto || `${parqueadero.nombre} ${parqueadero.direccion}`.toLowerCase().includes(texto))
      && (!filtros.tarifaMaxima || parqueadero.tarifaHora <= Number(filtros.tarifaMaxima))
      && (!filtros.soloConCupos || parqueadero.cupos > 0)
    ))
    .sort(COMPARADORES[filtros.orden])

  const seleccionado = visibles.find((item) => item.id === seleccionadoId) ?? null

  function ubicarme() {
    if (!navigator.geolocation) {
      setEstadoUbicacion('Tu navegador no permite obtener la ubicación.')
      return
    }
    setEstadoUbicacion('Buscando tu ubicación…')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUbicacion({ lat: coords.latitude, lng: coords.longitude })
        setSeleccionadoId(null)
        setFiltros((actuales) => ({ ...actuales, orden: 'distancia' }))
        setEstadoUbicacion('')
      },
      () => setEstadoUbicacion('No se pudo obtener tu ubicación. Revisa los permisos.'),
      { timeout: 10000 },
    )
  }

  return (
    <section className={styles.page}>
      <MapaParqueaderos
        parqueaderos={visibles}
        seleccionado={seleccionado}
        onSeleccionar={setSeleccionadoId}
        ubicacion={ubicacion}
      />

      <div className={styles.overlay}>
        <button
          type="button"
          className={styles.filtros}
          aria-expanded={panelAbierto}
          onClick={() => setPanelAbierto((abierto) => !abierto)}
        >
          Filtros
        </button>
        {panelAbierto && (
          <PanelDisponibles
            parqueaderos={visibles}
            seleccionadoId={seleccionadoId}
            onSeleccionar={setSeleccionadoId}
            filtros={filtros}
            onCambiarFiltros={setFiltros}
            hayUbicacion={Boolean(ubicacion)}
            onUbicarme={ubicarme}
            estadoUbicacion={estadoUbicacion}
          />
        )}
      </div>
    </section>
  )
}

export default Mapa
