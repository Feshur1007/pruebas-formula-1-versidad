import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './MapaParqueaderos.module.css'

const CENTRO_TUNJA = [5.5353, -73.3678]

function crearIcono(parqueadero, activo) {
  return L.divIcon({
    className: `${styles.marcador} ${activo ? styles.activo : ''}`,
    html: `P${parqueadero.id}`,
    iconSize: [36, 36],
  })
}

const iconoUsuario = L.divIcon({ className: styles.usuario, iconSize: [18, 18] })

// Centra el mapa en el punto elegido. Recibe números para volar solo cuando cambia.
function IrA({ lat, lng }) {
  const mapa = useMap()
  useEffect(() => {
    if (lat !== undefined) mapa.flyTo([lat, lng], 16)
  }, [lat, lng, mapa])
  return null
}

function MapaParqueaderos({ parqueaderos, seleccionado, onSeleccionar, ubicacion }) {
  const destino = seleccionado ?? ubicacion

  return (
    <MapContainer center={CENTRO_TUNJA} zoom={14} zoomControl={false} className={styles.mapa}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      <IrA lat={destino?.lat} lng={destino?.lng} />
      {ubicacion && (
        <Marker position={[ubicacion.lat, ubicacion.lng]} icon={iconoUsuario} interactive={false} />
      )}
      {parqueaderos.map((parqueadero) => (
        <Marker
          key={parqueadero.id}
          position={[parqueadero.lat, parqueadero.lng]}
          icon={crearIcono(parqueadero, seleccionado?.id === parqueadero.id)}
          eventHandlers={{ click: () => onSeleccionar(parqueadero.id) }}
        />
      ))}
    </MapContainer>
  )
}

export default MapaParqueaderos
