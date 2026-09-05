import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { PageTransition } from './PageTransition';
import { Menu } from 'lucide-react';
import styles from './AdminLayout.module.css';

export const AdminLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={styles.layout}>
      {/* Top Header Mobile */}
      <header className={styles.mobileHeader}>
        <button className={styles.menuButton} onClick={toggleMobileMenu}>
          <Menu size={24} />
        </button>
        <h2>CifrasApp Admin</h2>
      </header>

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Overlay for mobile when sidebar is open */}
      {isMobileMenuOpen && (
        <div className={styles.overlay} onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <main className={styles.mainContent}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
};
