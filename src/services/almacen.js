// Acceso a localStorage que no rompe la página si el navegador lo bloquea.
export function leerLocal(clave, respaldo) {
  try {
    const valor = localStorage.getItem(clave)
    return valor === null ? respaldo : JSON.parse(valor)
  } catch {
    return respaldo
  }
}

export function guardarLocal(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
    return true
  } catch {
    return false
  }
}

export function borrarLocal(clave) {
  try {
    localStorage.removeItem(clave)
  } catch {
    // Sin acceso a localStorage no hay nada que borrar.
  }
}
