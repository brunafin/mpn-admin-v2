import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import { buttonClassName } from '../components/Button';
import { login } from '../api/auth';
import {
  clearAccessToken,
  getAccessToken,
  getAccessTokenPayload,
  setAccessToken,
  type AdminTokenPayload,
} from '../utils/authCookie';
import { isPlatformAdminToken } from '../components/ProtectedRoute';
import { ADMIN_LOGO_URL } from '../constants/brand';

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAccessToken() && isPlatformAdminToken()) {
      navigate('/inicio', { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (!username.trim() || !password) {
      setFormError('Preencha usuário e senha.');
      return;
    }

    setLoading(true);
    try {
      const { access_token } = await login(username.trim(), password);
      setAccessToken(access_token);
      const payload = getAccessTokenPayload<AdminTokenPayload>();
      if (payload?.role !== 'platform_admin') {
        clearAccessToken();
        setFormError('Esta conta não tem acesso ao portal da plataforma.');
        return;
      }
      navigate('/inicio', { replace: true });
    } catch {
      setFormError('Usuário ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = Boolean(username.trim() && password) && !loading;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-master px-4 py-10 text-text-light">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <img
            src={ADMIN_LOGO_URL}
            alt="MPN Admin"
            className="h-20 w-20 object-contain sm:h-24 sm:w-24"
          />
          <h1 className="sr-only">Entrar</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Input
            name="username"
            title="E-mail ou usuário"
            placeholder="seu@email.com"
            type="text"
            mode="light"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (formError) setFormError('');
            }}
            required
            autoComplete="username"
            enterKeyHint="next"
            error={formError || undefined}
          />
          <Input
            name="password"
            title="Senha"
            placeholder="Sua senha"
            type="password"
            mode="light"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (formError) setFormError('');
            }}
            required
            autoComplete="current-password"
            enterKeyHint="go"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className={buttonClassName({
              variant: 'primary',
              className: 'mt-4',
            })}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
