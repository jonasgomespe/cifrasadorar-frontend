import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Book, Download, User } from 'lucide-react';
import { PageTransition } from './PageTransition';
import styles from './UserLayout.module.css';

export const UserLayout: React.FC = () => {
  return (
    <div className={styles.mobileContainer}>
      <main className={styles.mainContent}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <nav className={styles.bottomNav}>
        <NavLink to="/" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} end>
          <Home size={24} />
          <span>Início</span>
        </NavLink>
        
        <NavLink to="/library" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
          <Book size={24} />
          <span>Biblioteca</span>
        </NavLink>
        
        <NavLink to="/downloads" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
          <Download size={24} />
          <span>Downloads</span>
        </NavLink>
        
        <NavLink to="/profile" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
          <User size={24} />
          <span>Perfil</span>
        </NavLink>
      </nav>
    </div>
  );
};
