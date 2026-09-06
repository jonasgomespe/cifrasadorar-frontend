import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './presentation/components/Layout/AdminLayout';
import { UserLayout } from './presentation/components/Layout/UserLayout';
import { Dashboard } from './presentation/pages/Admin/Dashboard/Dashboard';
import { ChordsManagement } from './presentation/pages/Admin/Chords/ChordsManagement';
import { SongsManagement } from './presentation/pages/Admin/Songs/SongsManagement';
import { OfflineChords } from './presentation/pages/User/OfflineChords/OfflineChords';
import { Library } from './presentation/pages/User/Library/Library';
import { SongViewer } from './presentation/pages/User/SongViewer/SongViewer';
import { Profile } from './presentation/pages/User/Profile/Profile';
import { Login } from './presentation/pages/Login/Login';
import { SetlistsList } from './presentation/pages/User/Setlists/SetlistsList';
import { CreateSetlist } from './presentation/pages/User/Setlists/CreateSetlist';
import { SetlistView } from './presentation/pages/User/Setlists/SetlistView';
import { useAuthStore } from './presentation/hooks/useAuthStore';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'admin' | 'user' }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chords" element={<ChordsManagement />} />
          <Route path="songs" element={<SongsManagement />} />
          <Route path="users" element={<div>Gestão de Usuários (Em breve)</div>} />
          <Route path="settings" element={<div>Configurações (Em breve)</div>} />
        </Route>

        {/* Rota para o App Mobile do Usuário */}
        <Route path="/" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
          <Route index element={<OfflineChords />} />
          <Route path="library" element={<Library />} />
          <Route path="song/:id" element={<SongViewer />} />
          <Route path="setlists" element={<SetlistsList />} />
          <Route path="setlists/create" element={<CreateSetlist />} />
          <Route path="setlists/:id" element={<SetlistView />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
