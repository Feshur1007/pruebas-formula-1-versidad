import styles from './ParkingSpaces.module.css'

function ParkingSpaces({ plazas, plazaSeleccionada, onSelect }) {
  return (
    <section className={styles.panel}>
      <h2>1. Selecciona una plaza</h2>
      <div className={styles.grid}>
        {plazas.map((plaza) => {
          const seleccionada = plazaSeleccionada === plaza.id
          const ocupada = plaza.estado === 'Ocupada'

          return (
            <button
              key={plaza.id}
              type="button"
              className={`${styles.space} ${seleccionada ? styles.selected : ''} ${ocupada ? styles.occupied : ''}`}
              disabled={ocupada}
              onClick={() => onSelect(plaza.id)}
              aria-pressed={seleccionada}
            >
              <strong>{plaza.codigo}</strong>
              <span>{plaza.nombre}</span>
              <small>{seleccionada ? 'Seleccionada' : plaza.estado}</small>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default ParkingSpaces
