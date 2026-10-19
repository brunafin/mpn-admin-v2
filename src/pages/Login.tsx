import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { surfaceShadowClass } from '../components/Card';
import Input from '../components/Input';
import { buttonClassName } from '../components/Button';
import { login, portalForgotPassword, portalResetPassword } from '../api/auth';
import {
  clearAccessToken,
  getAccessToken,
  getAccessTokenPayload,
  setAccessToken,
  type AdminTokenPayload,
} from '../utils/authCookie';
import { isPlatformPortalToken } from '../components/ProtectedRoute';
import { ADMIN_LOGO_URL } from '../constants/brand';

const PASSWORD_HINT =
  'Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.';

type Step = 'login' | 'forgot' | 'code';

function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAccessToken() && isPlatformPortalToken()) {
      navigate('/inicio', { replace: true });
    }
  }, [navigate]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
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
      if (payload?.role !== 'platform_admin' && payload?.role !== 'representative') {
        clearAccessToken();
        setFormError('Esta conta não tem acesso ao portal da plataforma.');
        return;
      }
      navigate('/inicio', { replace: true });
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Usuário ou senha inválidos.'),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setInfo('');
    if (!username.trim() || !email.trim()) {
      setFormError('Preencha usuário e e-mail.');
      return;
    }
    setLoading(true);
    try {
      const result = await portalForgotPassword(username.trim(), email.trim());
      setInfo(result.message);
      setStep('code');
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Não foi possível enviar o código.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (!code.trim() || !newPassword) {
      setFormError('Preencha o código e a nova senha.');
      return;
    }
    setLoading(true);
    try {
      await portalResetPassword({
        username: username.trim(),
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      setPassword('');
      setCode('');
      setNewPassword('');
      setInfo('Senha definida. Entre com usuário e senha.');
      setStep('login');
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Não foi possível definir a senha.'));
    } finally {
      setLoading(false);
    }
  }

  const loginReady = Boolean(username.trim() && password) && !loading;
  const forgotReady = Boolean(username.trim() && email.trim()) && !loading;
  const resetReady = Boolean(code.trim() && newPassword) && !loading;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-canvas px-4 py-10 text-fg">
      <div className={`w-full max-w-sm rounded-lg bg-surface px-6 py-8 ${surfaceShadowClass}`}>
        <div className="mb-6 flex flex-col items-center">
          <img
            src={ADMIN_LOGO_URL}
            alt="MPN Admin"
            className="h-20 w-20 object-contain sm:h-24 sm:w-24"
          />
          <h1 className="sr-only">
            {step === 'login' ? 'Entrar' : 'Definir senha'}
          </h1>
        </div>

        {step === 'login' ? (
          <form onSubmit={handleLogin} noValidate>
            <Input
              name="username"
              title="E-mail ou usuário"
              placeholder="e-mail ou usuário"
              type="text"
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
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formError) setFormError('');
              }}
              required
              autoComplete="current-password"
              enterKeyHint="go"
            />
            {info ? (
              <p className="mb-3 text-sm text-success" role="status">
                {info}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={!loginReady}
              className={buttonClassName({
                variant: 'primary',
                fullWidth: true,
                className: 'mt-2',
              })}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
            <button
              type="button"
              className={buttonClassName({
                variant: 'ghost',
                fullWidth: true,
                className: 'mt-2',
              })}
              onClick={() => {
                setFormError('');
                setInfo('');
                setStep('forgot');
              }}
            >
              Primeiro acesso ou esqueci a senha
            </button>
          </form>
        ) : null}

        {step === 'forgot' ? (
          <form onSubmit={handleForgot} noValidate>
            <p className="mb-4 text-sm leading-5 text-fg-muted">
              Informe o usuário e o e-mail já cadastrados na sua conta.
            </p>
            <Input
              name="username"
              title="Usuário"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (formError) setFormError('');
              }}
            />
            <Input
              name="email"
              title="E-mail"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formError) setFormError('');
              }}
            />
            {formError ? (
              <p className="mb-3 text-sm font-medium text-danger" role="alert">
                {formError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={!forgotReady}
              className={buttonClassName({
                variant: 'primary',
                fullWidth: true,
                className: 'mt-2',
              })}
            >
              {loading ? 'Enviando…' : 'Enviar código'}
            </button>
            <button
              type="button"
              className={buttonClassName({
                variant: 'ghost',
                fullWidth: true,
                className: 'mt-2',
              })}
              onClick={() => {
                setFormError('');
                setInfo('');
                setStep('login');
              }}
            >
              Voltar ao login
            </button>
          </form>
        ) : null}

        {step === 'code' ? (
          <form onSubmit={handleReset} noValidate>
            {info ? (
              <p className="mb-4 text-sm leading-5 text-fg-muted">{info}</p>
            ) : (
              <p className="mb-4 text-sm leading-5 text-fg-muted">
                Digite o código enviado e a nova senha.
              </p>
            )}
            <Input
              name="code"
              title="Código"
              inputMode="numeric"
              required
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                if (formError) setFormError('');
              }}
            />
            <Input
              name="newPassword"
              title="Nova senha"
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (formError) setFormError('');
              }}
            />
            <p className="mb-3 text-xs text-fg-muted">{PASSWORD_HINT}</p>
            {formError ? (
              <p className="mb-3 text-sm font-medium text-danger" role="alert">
                {formError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={!resetReady}
              className={buttonClassName({
                variant: 'primary',
                fullWidth: true,
                className: 'mt-2',
              })}
            >
              {loading ? 'Salvando…' : 'Definir senha'}
            </button>
            <button
              type="button"
              className={buttonClassName({
                variant: 'ghost',
                fullWidth: true,
                className: 'mt-2',
              })}
              onClick={() => {
                setFormError('');
                setStep('forgot');
              }}
            >
              Reenviar código
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message) && message[0]) return String(message[0]);
  }
  return fallback;
}

export default LoginPage;
