import styles from './ReservationForm.module.css'

function ReservationForm({
  tiempoEspera,
  setTiempoEspera,
  duracion,
  setDuracion,
  placa,
  setPlaca,
  placaValida,
  horaInicio,
  horaFin,
}) {
  return (
    <section className={styles.panel}>
      <h2>2. Configura tu reserva</h2>
      <div className={styles.fields}>
        <label>
          Tiempo de espera
          <select value={tiempoEspera} onChange={(event) => setTiempoEspera(Number(event.target.value))}>
            <option value={0}>Sin espera</option>
            <option value={1}>1 hora</option>
            <option value={2}>2 horas</option>
            <option value={3}>3 horas</option>
          </select>
        </label>

        <label>
          Tiempo de estadía
          <select value={duracion} onChange={(event) => setDuracion(Number(event.target.value))}>
            <option value={1}>1 hora</option>
            <option value={2}>2 horas</option>
            <option value={3}>3 horas</option>
            <option value={4}>4 horas</option>
            <option value={8}>8 horas</option>
          </select>
        </label>

        <label>
          Placa del vehículo
          <input
            type="text"
            value={placa}
            maxLength={7}
            placeholder="Ej.: ABC 123"
            aria-invalid={placa.length > 0 && !placaValida}
            onChange={(event) => setPlaca(event.target.value.toUpperCase())}
          />
        </label>
      </div>

      <p className={styles.estimated}>
        Horario estimado: {horaInicio} a {horaFin}
      </p>
    </section>
  )
}

export default ReservationForm
