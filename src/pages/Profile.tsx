import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { getProfile, updateProfile, type PortalProfile } from '../api/profile';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import { PageHeader } from '../components/PageTitle';
import { ClientDetailSkeleton } from '../components/Skeleton';
import {
  formatCepMask,
  formatCpfMask,
  onlyCepDigits,
  onlyCpfDigits,
} from '../utils/formatCpfCep';
import { formatPhoneMask, onlyPhoneDigits } from '../utils/formatPhone';

const PASSWORD_HINT =
  'Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.';

export default function ProfilePage() {
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lookingCep, setLookingCep] = useState(false);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [password, setPassword] = useState('');

  const fill = (data: PortalProfile) => {
    setProfile(data);
    setName(data.name);
    setUsername(data.username);
    setEmail(data.email || '');
    setPhone(data.phone ? formatPhoneMask(data.phone) : '');
    setCpf(data.cpf ? formatCpfMask(data.cpf) : '');
    setCep(data.cep ? formatCepMask(data.cep) : '');
    setStreet(data.street || '');
    setNumber(data.number || '');
    setNeighborhood(data.neighborhood || '');
    setCity(data.city || '');
    setUf(data.uf || '');
    setPassword('');
  };

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((data) => {
        if (!cancelled) fill(data);
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar o perfil.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const lookupCep = async (raw: string) => {
    const digits = onlyCepDigits(raw);
    if (digits.length !== 8) return;
    setLookingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) return;
      if (data.logradouro) setStreet(data.logradouro);
      if (data.bairro) setNeighborhood(data.bairro);
      if (data.localidade) setCity(data.localidade);
      if (data.uf) setUf(data.uf);
    } catch {
      /* CEP continua editável manualmente */
    } finally {
      setLookingCep(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const phoneDigits = onlyPhoneDigits(phone);
    if (phone && phoneDigits.length < 10) {
      setFormError('Informe um telefone válido.');
      return;
    }
    const cpfDigits = onlyCpfDigits(cpf);
    if (cpf && cpfDigits.length !== 11) {
      setFormError('Informe um CPF válido.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    setSaved(false);
    try {
      const updated = await updateProfile({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim() || null,
        phone: phoneDigits || null,
        cpf: cpfDigits || null,
        cep: onlyCepDigits(cep) || null,
        street: street.trim() || null,
        number: number.trim() || null,
        neighborhood: neighborhood.trim() || null,
        city: city.trim() || null,
        uf: uf.trim().toUpperCase() || null,
        ...(password ? { password } : {}),
      });
      fill(updated);
      setSaved(true);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Não foi possível salvar o perfil.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <PageHeader title="Perfil" />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 lg:px-8">
          {loading && !profile ? <ClientDetailSkeleton /> : null}
          {error ? (
            <p className="text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {profile ? (
            <form onSubmit={handleSubmit} className="max-w-xl space-y-1">
                <Input
                  name="name"
                  title="Nome"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <Input
                  name="username"
                  title="Usuário (login)"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
                <Input
                  name="email"
                  title="E-mail"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <Input
                  name="phone"
                  title="Telefone"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(formatPhoneMask(event.target.value))
                  }
                />
                <Input
                  name="cpf"
                  title="CPF"
                  inputMode="numeric"
                  value={cpf}
                  onChange={(event) =>
                    setCpf(formatCpfMask(event.target.value))
                  }
                />
                <Input
                  name="cep"
                  title={lookingCep ? 'CEP (buscando…)' : 'CEP'}
                  inputMode="numeric"
                  value={cep}
                  onChange={(event) => {
                    const next = formatCepMask(event.target.value);
                    setCep(next);
                    if (onlyCepDigits(next).length === 8) {
                      void lookupCep(next);
                    }
                  }}
                />
                <Input
                  name="street"
                  title="Rua"
                  value={street}
                  onChange={(event) => setStreet(event.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="number"
                    title="Número"
                    value={number}
                    onChange={(event) => setNumber(event.target.value)}
                  />
                  <Input
                    name="neighborhood"
                    title="Bairro"
                    value={neighborhood}
                    onChange={(event) => setNeighborhood(event.target.value)}
                  />
                </div>
                <div className="grid grid-cols-[1fr_5rem] gap-3">
                  <Input
                    name="city"
                    title="Cidade"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  />
                  <Input
                    name="uf"
                    title="UF"
                    value={uf}
                    onChange={(event) =>
                      setUf(event.target.value.toUpperCase().slice(0, 2))
                    }
                  />
                </div>
                <Input
                  name="password"
                  title="Nova senha"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <p className="mb-3 text-xs text-fg-muted">{PASSWORD_HINT}</p>
                {formError ? (
                  <p className="mb-3 text-sm font-medium text-danger" role="alert">
                    {formError}
                  </p>
                ) : null}
                {saved ? (
                  <p className="mb-3 text-sm text-success" role="status">
                    Perfil salvo.
                  </p>
                ) : null}
                <Button type="submit" fullWidth disabled={submitting}>
                  {submitting ? 'Salvando…' : 'Salvar'}
                </Button>
              </form>
          ) : null}
        </div>
      </section>
    </AppLayout>
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
