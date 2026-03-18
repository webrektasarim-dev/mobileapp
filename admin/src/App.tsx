import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { api, clearToken, getToken, setToken } from './api';

type Tab = 'products' | 'orders' | 'banners' | 'coupons' | 'logs';

function App() {
  const [token, setTok] = useState<string | null>(() => getToken());
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<Tab>('products');

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      const r = await api<{ accessToken: string }>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(r.accessToken);
      setTok(r.accessToken);
    } catch {
      setErr('Giriş başarısız');
    }
  };

  const logout = () => {
    clearToken();
    setTok(null);
  };

  if (!token) {
    return (
      <div className="wrap">
        <h1>Admin</h1>
        <form onSubmit={login} className="card">
          {err && <p className="err">{err}</p>}
          <label>
            E-posta
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </label>
          <label>
            Şifre
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit">Giriş</button>
        </form>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header className="top">
        <h1>Admin Panel</h1>
        <button type="button" onClick={logout}>
          Çıkış
        </button>
      </header>
      <nav className="tabs">
        {(
          [
            ['products', 'Ürünler'],
            ['orders', 'Siparişler'],
            ['banners', 'Banner'],
            ['coupons', 'Kuponlar'],
            ['logs', 'Audit Log'],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            className={tab === k ? 'active' : ''}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </nav>
      <main className="main">
        {tab === 'products' && <ProductsPanel />}
        {tab === 'orders' && <OrdersPanel />}
        {tab === 'banners' && <BannersPanel />}
        {tab === 'coupons' && <CouponsPanel />}
        {tab === 'logs' && <LogsPanel />}
      </main>
    </div>
  );
}

type ProductRow = { id: string; name: string; slug: string };

function ProductsPanel() {
  const [data, setData] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    api<ProductRow[]>('/admin/products')
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  if (loading) return <p>Yükleniyor…</p>;
  return (
    <div>
      <p className="muted">{data.length} ürün</p>
      <ul className="list">
        {data.map((p) => (
          <li key={p.id}>
            {p.name} <code>{p.slug}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrdersPanel() {
  const [data, setData] = useState<
    { id: string; status: string; total: unknown; user?: { email: string } }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    api<typeof data>('/admin/orders')
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    try {
      await api(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      load();
    } catch {
      alert('Güncellenemedi');
    }
  };

  if (loading) return <p>Yükleniyor…</p>;
  return (
    <table className="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Müşteri</th>
          <th>Tutar</th>
          <th>Durum</th>
          <th>İşlem</th>
        </tr>
      </thead>
      <tbody>
        {data.map((o) => (
          <tr key={o.id}>
            <td>
              <code>{o.id.slice(0, 8)}…</code>
            </td>
            <td>{o.user?.email ?? '—'}</td>
            <td>{String(o.total)}</td>
            <td>{o.status}</td>
            <td>
              <select
                value={o.status}
                onChange={(e) => setStatus(o.id, e.target.value)}
              >
                <option value="pending_payment">pending_payment</option>
                <option value="paid">paid</option>
                <option value="processing">processing</option>
                <option value="shipped">shipped</option>
                <option value="delivered">delivered</option>
                <option value="cancelled">cancelled</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BannersPanel() {
  const [data, setData] = useState<{ id: string; imageUrl: string }[]>([]);
  const load = useCallback(() => {
    api<typeof data>('/admin/banners').then(setData).catch(() => setData([]));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <div>
      <ul className="list">
        {data.map((b) => (
          <li key={b.id}>
            <img src={b.imageUrl} alt="" width={200} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CouponsPanel() {
  const [data, setData] = useState<{ code: string; type: string; value: unknown }[]>(
    [],
  );
  const load = useCallback(() => {
    api<typeof data>('/admin/coupons').then(setData).catch(() => setData([]));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <div>
      <ul className="list">
        {data.map((c) => (
          <li key={c.code}>
            <strong>{c.code}</strong> — {c.type} {String(c.value)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LogsPanel() {
  const [data, setData] = useState<
    { id: string; action: string; entity: string; admin?: { email: string } }[]
  >([]);
  useEffect(() => {
    api<typeof data>('/admin/activity-logs')
      .then(setData)
      .catch(() => setData([]));
  }, []);
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Zaman</th>
          <th>Admin</th>
          <th>Aksiyon</th>
          <th>Varlık</th>
        </tr>
      </thead>
      <tbody>
        {data.map((l) => (
          <tr key={l.id}>
            <td>
              <code>{l.id.slice(0, 8)}</code>
            </td>
            <td>{l.admin?.email ?? '—'}</td>
            <td>{l.action}</td>
            <td>{l.entity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default App;
