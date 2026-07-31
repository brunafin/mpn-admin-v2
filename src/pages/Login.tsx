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

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAccessToken() && isPlatformAdminToken()) {
      navigate('/clientes', { replace: true });
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
      navigate('/clientes', { replace: true });
    } catch {
      setFormError('Usuário ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = Boolean(username.trim() && password) && !loading;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-master px-4 py-10 text-text-light">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,84,160,0.18),_transparent_55%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 flex w-full max-w-[16rem] items-center justify-center sm:max-w-[18rem]">
            <img
              src={ADMIN_LOGO_URL}
              alt="MPN Admin"
              className="h-auto w-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-light">
            Entrar
          </h1>
          <p className="mt-2 text-base leading-6 text-text-light/70">
            Portal interno da plataforma
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-master-light p-5 sm:p-6"
          noValidate
        >
          <Input
            name="username"
            title="E-mail ou usuário"
            placeholder="seu@email.com"
            type="text"
            mode="dark"
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
            mode="dark"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (formError) setFormError('');
            }}
            required
            autoComplete="current-password"
            enterKeyHint="go"
            className="mt-1"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className={buttonClassName({
              variant: 'primary',
              className: 'mt-6',
            })}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
