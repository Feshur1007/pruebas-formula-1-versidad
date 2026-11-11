
import styles from './UserSidebar.module.css'

function UserSidebar({ seccionActiva, onSelect }) {
  const opciones = [
    { id: 'notificaciones', nombre: 'Notificaciones' },
    { id: 'transacciones', nombre: 'Transacciones' },
    { id: 'cuenta', nombre: 'Cuenta' },
  ]

  return (
    <aside className={styles.sidebar}>
      {opciones.map((opcion) => (
        <button
          key={opcion.id}
          className={
            seccionActiva === opcion.id
              ? styles.active
              : styles.option
          }
          onClick={() => onSelect(opcion.id)}
        >
          {opcion.nombre}
        </button>
      ))}
    </aside>
  )
}

export default UserSidebar
