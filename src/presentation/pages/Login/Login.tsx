import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { authService } from '../../../services/authService';
import { useAuthStore } from '../../hooks/useAuthStore';
import { Music, AlertCircle } from 'lucide-react';
import './Login.css';

export function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!credentialResponse.credential) {
        throw new Error('Nenhuma credencial recebida do Google');
      }

      const response = await authService.loginWithGoogle(credentialResponse.credential);

      // Salva no store do Zustand
      login(response.token, response.user);

      // Redireciona com base na role ou padrão
      if (response.user.role === 'admin') {
        console.log(response.user.role);
        navigate('/admin/dashboard', { replace: true });
      } else {
        console.log(response.user);
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <Music size={40} className="logo-icon" />
          </div>
          <h1>Cifras Adorar</h1>
          <p>Entre ou cadastre-se com o Google para continuar</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="login-action">
          {isLoading ? (
            <div className="login-loading">Autenticando...</div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('O login com Google falhou')}
              useOneTap
              theme="filled_black"
              shape="pill"
              text="continue_with"
              size="large"
            />
          )}
        </div>
      </div>
    </div>
  );
}
