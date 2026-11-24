import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Settings as SettingsIcon, LogOut, Boxes, Menu, X, Plus, Search, Pencil, Trash2, AlertTriangle, TrendingUp, IndianRupee, CheckCircle2 } from 'lucide-react';
import api from './api';

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('stockflow_user')); } catch { return null; }
  });
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('stockflow_token'); localStorage.removeItem('stockflow_user');
    setUser(null); navigate('/login');
  };
  const login = data => {
    localStorage.setItem('stockflow_token', data.token);
    localStorage.setItem('stockflow_user', JSON.stringify(data.user));
    setUser(data.user); navigate('/');
  };
  return <Routes>
    <Route path="/login" element={user ? <Navigate to="/" /> : <AuthPage mode="login" onAuth={login} />} />
    <Route path="/signup" element={user ? <Navigate to="/" /> : <AuthPage mode="signup" onAuth={login} />} />
    <Route path="/*" element={user ? <Shell user={user} logout={logout} /> : <Navigate to="/login" />} />
  </Routes>;
}

function AuthPage({ mode, onAuth }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', organizationName:'' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const signup = mode === 'signup';
  const update = e => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true);
    try { const { data } = await api.post(`/auth/${signup ? 'signup' : 'login'}`, form); onAuth(data); }
    catch (err) { setError(err.response?.data?.message || 'Unable to connect to the server. Is the backend running?'); }
    finally { setBusy(false); }
  };
  return <div className="auth-wrap"><div className="auth-card">
    <div className="brand auth-brand"><div className="brand-mark"><Boxes size={22}/></div><span>stockflow</span></div>
    <div className="eyebrow">INVENTORY, MADE SIMPLE</div>
    <h1>{signup ? 'Create your account' : 'Welcome back'}</h1>
    <p className="muted">{signup ? 'Start managing your inventory in one place.' : 'Sign in to continue to your workspace.'}</p>
    <form onSubmit={submit} className="form-stack">
      {signup && <><label>Your name<input name="name" value={form.name} onChange={update} placeholder="e.g. Alex Morgan" required /></label>
      <label>Organization name<input name="organizationName" value={form.organizationName} onChange={update} placeholder="e.g. My Test Store" required /></label></>}
      <label>Email address<input type="email" name="email" value={form.email} onChange={update} placeholder="you@example.com" required /></label>
      <label>Password<input type="password" name="password" value={form.password} onChange={update} placeholder="At least 8 characters" minLength={signup ? 8 : undefined} required /></label>
      {error && <div className="alert error">{error}</div>}
      <button className="btn primary full" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}</button>
    </form>
    <p className="auth-switch">{signup ? 'Already have an account?' : "Don't have an account?"} <a href={signup ? '/login' : '/signup'}>{signup ? 'Sign in' : 'Create account'}</a></p>
  </div></div>;
}

function Shell({ user, logout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMobileOpen(false), [location.pathname]);
  const links = [{to:'/',label:'Dashboard',icon:LayoutDashboard},{to:'/products',label:'Products',icon:Package},{to:'/settings',label:'Settings',icon:SettingsIcon}];
  return <div className="app-shell">
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Boxes size={22}/></div><span>stockflow</span></div>
      <div className="side-label">WORKSPACE</div>
      <nav>{links.map(item => <NavLink key={item.to} end={item.to === '/'} to={item.to} className={({isActive}) => `nav-link ${isActive?'active':''}`}><item.icon size={18}/>{item.label}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="org-chip"><div className="avatar">{user.name?.[0]?.toUpperCase()}</div><div><strong>{user.organizationName}</strong><small>{user.email}</small></div></div><button className="nav-link logout" onClick={logout}><LogOut size={18}/>Sign out</button></div>
    </aside>
    <main className="main-area"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen?<X/>:<Menu/>}</button><div><span className="topbar-title">{links.find(l => l.to === location.pathname)?.label || 'Workspace'}</span><span className="topbar-sub">Manage your store with confidence</span></div><div className="topbar-user"><div className="avatar">{user.name?.[0]?.toUpperCase()}</div><span>{user.name}</span></div></header>
      <div className="page-content"><Routes><Route path="/" element={<Dashboard/>}/><Route path="/products" element={<Products/>}/><Route path="/settings" element={<Settings/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes></div>
    </main>
  </div>;
}

function Dashboard() {
  const [data,setData] = useState(null); const [error,setError] = useState('');
  const load = () => api.get('/dashboard').then(r=>setData(r.data)).catch(e=>setError(e.response?.data?.message || 'Could not load dashboard.'));
  useEffect(()=>{load();},[]);
  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="loading">Loading your dashboard…</div>;
  return <><div className="page-heading"><div><div className="eyebrow">OVERVIEW</div><h1>Good to see you</h1><p className="muted">Here's what's happening with your inventory today.</p></div></div>
    <div className="stats-grid">
      <Stat icon={Package} label="Total products" value={data.totalProducts} note="Products in your catalog"/>
      <Stat icon={Boxes} label="Units in stock" value={data.totalQuantity} note="Total quantity on hand"/>
      <Stat icon={AlertTriangle} label="Low stock items" value={data.lowStock.length} note="Products needing attention" warning/>
    </div>
    <section className="panel"><div className="panel-head"><div><h2>Low stock items</h2><p className="muted">Products at or below their stock threshold</p></div><span className="count-pill">{data.lowStock.length} items</span></div>
      {data.lowStock.length ? <div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>SKU</th><th>AVAILABLE</th><th>THRESHOLD</th><th>STATUS</th></tr></thead><tbody>{data.lowStock.map(p=><tr key={p.id}><td className="product-name">{p.name}</td><td>{p.sku}</td><td><strong>{p.quantity}</strong></td><td>{p.threshold}</td><td><span className="status low">Low stock</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-icon success"><CheckCircle2/></div><strong>All stocked up!</strong><p>No products are currently below their threshold.</p></div>}
    </section>
  </>;
}
function Stat({icon:Icon,label,value,note,warning}) { return <div className="stat-card"><div className={`stat-icon ${warning?'warn':''}`}><Icon size={20}/></div><div className="stat-label">{label}</div><div className="stat-value">{value.toLocaleString('en-IN')}</div><div className="stat-note">{note}</div></div>; }

function Products() {
  const [items,setItems]=useState([]); const [query,setQuery]=useState(''); const [modal,setModal]=useState(null); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const blank={name:'',sku:'',description:'',quantity:0,costPrice:'',sellingPrice:'',lowStockThreshold:''};
  const load=()=>api.get('/products').then(r=>setItems(r.data)).catch(e=>setError(e.response?.data?.message||'Could not load products.'));
  useEffect(()=>{load();},[]);
  const filtered=items.filter(p=>`${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()));
  const save=async form=>{
    setBusy(true);setError('');
    try { if(modal?.id) await api.put(`/products/${modal.id}`,form); else await api.post('/products',form); setModal(null); await load(); }
    catch(e){setError(e.response?.data?.message||'Could not save product.');}
    finally{setBusy(false);}
  };
  const remove=async p=>{if(!window.confirm(`Delete "${p.name}"? This cannot be undone.`))return;try{await api.delete(`/products/${p.id}`);load();}catch(e){setError(e.response?.data?.message||'Could not delete product.');}};
  return <><div className="page-heading heading-row"><div><div className="eyebrow">CATALOG</div><h1>Products</h1><p className="muted">Keep your product details and stock levels up to date.</p></div><button className="btn primary" onClick={()=>{setError('');setModal({product:blank});}}><Plus size={17}/> Add product</button></div>
    {error&&<div className="alert error">{error}</div>}
    <section className="panel"><div className="toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by product name or SKU…"/></div><span className="muted small">{filtered.length} products</span></div>
      {filtered.length ? <div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>SKU</th><th>QUANTITY</th><th>SELLING PRICE</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><div className="product-name">{p.name}</div>{p.description&&<small className="muted">{p.description}</small>}</td><td>{p.sku}</td><td><strong>{p.quantity}</strong> units</td><td>{p.sellingPrice==null?'—':`₹${Number(p.sellingPrice).toLocaleString('en-IN')}`}</td><td>{p.quantity <= (p.effectiveLowStockThreshold ?? 5) ? <span className="status low">Low stock</span>:<span className="status healthy">In stock</span>}</td><td><div className="actions"><button className="icon-btn" title="Edit product" onClick={()=>{setError('');setModal({id:p.id,product:{...p,lowStockThreshold:p.lowStockThreshold??''}});}}><Pencil size={16}/></button><button className="icon-btn danger" title="Delete product" onClick={()=>remove(p)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-icon"><Package/></div><strong>{query?'No matching products':'No products yet'}</strong><p>{query?'Try another search term.':'Add your first product to start tracking inventory.'}</p>{!query&&<button className="btn primary" onClick={()=>setModal({product:blank})}><Plus size={16}/> Add your first product</button>}</div>}
    </section>
    {modal&&<ProductModal initial={modal.product} busy={busy} onClose={()=>setModal(null)} onSave={save}/>}
  </>;
}
function ProductModal({initial,busy,onClose,onSave}) {
  const [form,setForm]=useState(initial); const change=e=>setForm({...form,[e.target.name]:e.target.value});
  const submit=e=>{e.preventDefault();onSave({...form,quantity:Number(form.quantity),costPrice:form.costPrice===''?'':Number(form.costPrice),sellingPrice:form.sellingPrice===''?'':Number(form.sellingPrice),lowStockThreshold:form.lowStockThreshold===''?'':Number(form.lowStockThreshold)});};
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal"><div className="modal-head"><div><h2>{initial.id?'Edit product':'Add a product'}</h2><p className="muted">Enter the product details below.</p></div><button className="icon-btn" onClick={onClose}><X/></button></div>
    <form className="form-stack" onSubmit={submit}><div className="form-grid"><label>Product name *<input name="name" value={form.name} onChange={change} placeholder="e.g. Wireless headphones" required/></label><label>SKU *<input name="sku" value={form.sku} onChange={change} placeholder="e.g. AUD-001" required/></label></div>
      <label>Description<input name="description" value={form.description||''} onChange={change} placeholder="Short product description"/></label>
      <div className="form-grid"><label>Quantity on hand *<input type="number" min="0" step="1" name="quantity" value={form.quantity} onChange={change} required/></label><label>Low-stock threshold<input type="number" min="0" step="1" name="lowStockThreshold" value={form.lowStockThreshold??''} onChange={change} placeholder="Use organization default"/></label></div>
      <div className="form-grid"><label>Cost price (₹)<input type="number" min="0" step="0.01" name="costPrice" value={form.costPrice??''} onChange={change} placeholder="Optional"/></label><label>Selling price (₹)<input type="number" min="0" step="0.01" name="sellingPrice" value={form.sellingPrice??''} onChange={change} placeholder="Optional"/></label></div>
      <div className="modal-actions"><button type="button" className="btn secondary" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy?'Saving…':'Save product'}</button></div>
    </form></div></div>;
}

function Settings() {
  const [threshold,setThreshold]=useState(5);const [org,setOrg]=useState('');const [message,setMessage]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  useEffect(()=>{api.get('/settings').then(r=>{setThreshold(r.data.defaultLowStockThreshold);setOrg(r.data.name);}).catch(e=>setError(e.response?.data?.message||'Could not load settings.'));},[]);
  const save=async e=>{e.preventDefault();setBusy(true);setMessage('');setError('');try{await api.put('/settings',{defaultLowStockThreshold:Number(threshold)});setMessage('Your default threshold has been saved.');}catch(e){setError(e.response?.data?.message||'Could not save settings.');}finally{setBusy(false);}};
  return <><div className="page-heading"><div><div className="eyebrow">PREFERENCES</div><h1>Settings</h1><p className="muted">Configure how StockFlow monitors your inventory.</p></div></div>
    <section className="panel settings-panel"><div className="panel-head"><div><h2>Inventory settings</h2><p className="muted">These preferences apply to your organization.</p></div></div>
      <form onSubmit={save} className="form-stack settings-form"><label>Organization name<input value={org} disabled/></label><label>Default low-stock threshold<input type="number" min="0" step="1" value={threshold} onChange={e=>setThreshold(e.target.value)} required/><small className="muted">Products with no individual threshold will use this value. A product is low stock when its quantity is less than or equal to the threshold.</small></label>
        {message&&<div className="alert success">{message}</div>}{error&&<div className="alert error">{error}</div>}<div><button className="btn primary" disabled={busy}>{busy?'Saving…':'Save settings'}</button></div>
      </form>
    </section>
  </>;
}
export default App;