import React from 'react';
import { useAuthStore } from '../../../hooks/useAuthStore';
import { usePwaInstall } from '../../../hooks/usePwaInstall';
import { LogOut, User as UserIcon, Download, CheckCircle } from 'lucide-react';
import './Profile.css';

export const Profile: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isInstalled, installApp } = usePwaInstall();

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>Meu Perfil</h1>
      </header>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} />
            ) : (
              <UserIcon size={40} color="#a6adc8" />
            )}
          </div>
          <div className="profile-info">
            <h2>{user?.name || 'Usuário'}</h2>
            <p>{user?.email || 'Nenhum email cadastrado'}</p>
          </div>
        </div>

        {!isInstalled ? (
          <button className="install-pwa-button" onClick={installApp}>
            <Download size={20} />
            <span>Instalar Aplicativo no Celular</span>
          </button>
        ) : (
          <div className="installed-badge">
            <CheckCircle size={18} color="var(--primary-color)" />
            <span>Aplicativo instalado no dispositivo</span>
          </div>
        )}

        <button className="logout-button" onClick={logout}>
          <LogOut size={20} />
          <span>Sair da conta</span>
        </button>
      </div>
    </div>
  );
};
