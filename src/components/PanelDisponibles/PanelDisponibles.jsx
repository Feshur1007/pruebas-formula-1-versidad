import { Link } from 'react-router-dom'
import { pesos } from '../../utils/formato'
import styles from './PanelDisponibles.module.css'

const TARIFAS = [3000, 3500, 4000]

function PanelDisponibles({
  parqueaderos,
  seleccionadoId,
  onSeleccionar,
  filtros,
  onCambiarFiltros,
  hayUbicacion,
  onUbicarme,
  estadoUbicacion,
}) {
  function cambiar(campo, valor) {
    onCambiarFiltros((actuales) => ({ ...actuales, [campo]: valor }))
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.filtros}>
        <input
          type="search"
          aria-label="Buscar por nombre o dirección"
          placeholder="Buscar por nombre o dirección"
          value={filtros.texto}
          onChange={(evento) => cambiar('texto', evento.target.value)}
        />
        <div className={styles.fila}>
          <label>
            Tarifa
            <select value={filtros.tarifaMaxima} onChange={(evento) => cambiar('tarifaMaxima', evento.target.value)}>
              <option value="">Cualquiera</option>
              {TARIFAS.map((tarifa) => <option key={tarifa} value={tarifa}>Hasta {pesos(tarifa)}</option>)}
            </select>
          </label>
          <label>
            Ordenar por
            <select value={filtros.orden} onChange={(evento) => cambiar('orden', evento.target.value)}>
              <option value="precio">Menor precio</option>
              <option value="cupos">Más cupos</option>
              <option value="distancia" disabled={!hayUbicacion}>Más cerca</option>
            </select>
          </label>
        </div>
        <label className={styles.casilla}>
          <input
            type="checkbox"
            checked={filtros.soloConCupos}
            onChange={(evento) => cambiar('soloConCupos', evento.target.checked)}
          />
          Solo con cupos disponibles
        </label>
        <button type="button" className={styles.ubicarme} onClick={onUbicarme}>
          Usar mi ubicación
        </button>
        {estadoUbicacion && <p className={styles.estado} role="status">{estadoUbicacion}</p>}
      </div>

      <h2>Disponibles ({parqueaderos.length})</h2>
      {parqueaderos.length === 0 && <p className={styles.estado}>Ningún parqueadero coincide con los filtros.</p>}
      {parqueaderos.map((parqueadero) => {
        const activo = seleccionadoId === parqueadero.id
        const tieneCupos = parqueadero.cupos > 0

        return (
          <div key={parqueadero.id} className={`${styles.card} ${activo ? styles.activo : ''} ${tieneCupos ? '' : styles.lleno}`}>
            <button type="button" className={styles.info} onClick={() => onSeleccionar(parqueadero.id)}>
              <strong>{parqueadero.nombre}</strong>
              <span className={styles.cupos}>
                {tieneCupos ? `${parqueadero.cupos} cupos disponibles` : 'Sin cupos'}
              </span>
              <small>
                {pesos(parqueadero.tarifaHora)} / hora · {parqueadero.direccion}
                {parqueadero.distancia !== null && ` · ${parqueadero.distancia.toFixed(1)} km`}
              </small>
            </button>
            {activo && tieneCupos && (
              <Link to={`/reservas/${parqueadero.id}`} className={styles.reservar}>
                Reservar
              </Link>
            )}
          </div>
        )
      })}
    </aside>
  )
}

export default PanelDisponibles
