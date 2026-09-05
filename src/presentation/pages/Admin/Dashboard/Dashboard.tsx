import React from 'react';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Painel do Administrador</h1>
          <p className={styles.subtitle}>Gerencie acordes e músicas da plataforma</p>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total de Acordes</h3>
          <p className={styles.statNumber}>124</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total de Músicas</h3>
          <p className={styles.statNumber}>45</p>
        </div>
        <div className={styles.statCard}>
          <h3>Usuários Registrados</h3>
          <p className={styles.statNumber}>12</p>
        </div>
      </div>
    </div>
  );
};
