import { useEffect, useState } from 'react'

// Hora actual que se refresca sola, para horarios y estados de reservas.
export function useAhora(intervalo = 30000) {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const temporizador = setInterval(() => setAhora(Date.now()), intervalo)
    return () => clearInterval(temporizador)
  }, [intervalo])

  return ahora
}
