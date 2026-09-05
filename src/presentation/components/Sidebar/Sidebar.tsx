import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Music, BookOpen, Users, Settings, LogOut, X } from 'lucide-react';
import { useAuthStore } from '../../hooks/useAuthStore';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuthStore();

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.logo}>
        <Music className={styles.logoIcon} size={28} />
        <h2>CifrasApp</h2>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        )}
      </div>

      <nav className={styles.nav}>
        <NavLink 
          to="/admin/dashboard" 
          onClick={onClose}
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/admin/chords" 
          onClick={onClose}
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <BookOpen size={20} />
          <span>Acordes</span>
        </NavLink>
        
        <NavLink 
          to="/admin/songs" 
          onClick={onClose}
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <Music size={20} />
          <span>Músicas</span>
        </NavLink>

        <NavLink 
          to="/admin/users" 
          onClick={onClose}
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <Users size={20} />
          <span>Usuários</span>
        </NavLink>

        <NavLink 
          to="/admin/settings" 
          onClick={onClose}
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <Settings size={20} />
          <span>Configurações</span>
        </NavLink>
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.logoutButton} onClick={logout}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
