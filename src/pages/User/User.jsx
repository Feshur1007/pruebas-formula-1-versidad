
import { useState } from 'react'
import UserSidebar from '../../components/UserSidebar/UserSidebar'
import UserNotifications from '../../components/UserNotifications/UserNotifications'
import UserTransactions from '../../components/UserTransactions/UserTransactions'
import UserAccount from '../../components/UserAccount/UserAccount'
import styles from './User.module.css'

function User() {
  const [seccionActiva, setSeccionActiva] = useState('notificaciones')

  function renderSeccion() {
    switch (seccionActiva) {
      case 'notificaciones':
        return <UserNotifications />

      case 'transacciones':
        return <UserTransactions />

      case 'cuenta':
        return <UserAccount />

      default:
        return <UserNotifications />
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Mi usuario</h1>
        <p>
          Administra tus notificaciones, transacciones
          y datos personales.
        </p>
      </header>

      <div className={styles.layout}>
        <UserSidebar
          seccionActiva={seccionActiva}
          onSelect={setSeccionActiva}
        />

        <main className={styles.content}>
          {renderSeccion()}
        </main>
      </div>
    </div>
  )
}

export default User
