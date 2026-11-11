import styles from './ParkingInfo.module.css'

function ParkingInfo({ parqueadero, libres, total }) {
  return (
    <section className={styles.card}>
      <div>
        <h2>{parqueadero.nombre}</h2>
        <p>{parqueadero.direccion} · Tunja</p>
      </div>
      <div className={styles.chips}>
        <span className={styles.chip}>Tarifa ${parqueadero.tarifaHora.toLocaleString('es-CO')} / hora</span>
        <span className={`${styles.chip} ${styles.libres}`}>{libres} de {total} plazas libres</span>
      </div>
    </section>
  )
}

export default ParkingInfo
