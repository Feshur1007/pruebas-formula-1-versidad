const RADIO_TIERRA_KM = 6371
const radianes = (grados) => (grados * Math.PI) / 180

// Distancia en línea recta entre dos puntos (fórmula de Haversine).
export function distanciaKm(a, b) {
  const dLat = radianes(b.lat - a.lat)
  const dLng = radianes(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(radianes(a.lat)) * Math.cos(radianes(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h))
}
