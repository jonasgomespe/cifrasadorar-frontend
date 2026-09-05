import React from 'react';
import { useAuthStore } from '../../../hooks/useAuthStore';
import { LogOut, User as UserIcon } from 'lucide-react';
import './Profile.css';

export const Profile: React.FC = () => {
  const { user, logout } = useAuthStore();

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

        <button className="logout-button" onClick={logout}>
          <LogOut size={20} />
          <span>Sair da conta</span>
        </button>
      </div>
    </div>
  );
};
