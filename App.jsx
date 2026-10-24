import { useState } from 'react';

const WHATSAPP = '573189330624';

const products = [
  { id: 1, name: 'Audífonos inalámbricos Pro', category: 'Tecnología', price: 189900, icon: '🎧' },
  { id: 2, name: 'Tenis urbanos edición demo', category: 'Moda', price: 249900, icon: '👟' },
  { id: 3, name: 'Termo térmico premium', category: 'Hogar', price: 119900, icon: '🥤' },
  { id: 4, name: 'Parlante portátil Bluetooth', category: 'Tecnología', price: 169900, icon: '🔊' },
  { id: 5, name: 'Set de cuidado personal', category: 'Belleza', price: 139900, icon: '✨' },
  { id: 6, name: 'Accesorio organizador de viaje', category: 'Viaje', price: 89900, icon: '🧳' },
  { id: 7, name: 'Lámpara LED para escritorio', category: 'Hogar', price: 129900, icon: '💡' },
  { id: 8, name: 'Gadget inteligente para casa', category: 'Tecnología', price: 219900, icon: '🏠' }
];

const categories = [
  ['cat-tech', 'Tecnología', 'Gadgets y accesorios'],
  ['cat-style', 'Moda', 'Estilo para cada día'],
  ['cat-beauty', 'Belleza', 'Cuidado personal'],
  ['cat-home', 'Hogar', 'Soluciones prácticas'],
  ['cat-travel', 'Viaje', 'Accesorios para moverte']
];

const money = value => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
}).format(value);

function whatsappUrl(items) {
  const lines = items.map(item => `• ${item.name} x${item.quantity} — ${money(item.price * item.quantity)}`);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const text = `Hola, Importaciones EBC. Quiero solicitar este pedido:\n\n${lines.join('\n')}\n\nTotal estimado: ${money(total)}\n\nQuedo atento(a) para confirmar disponibilidad y entrega.`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
}

function ProductCard({ product, onAdd }) {
  return (
    <article className="product">
      <div className="product-art">{product.icon}</div>
      <div className="product-body">
        <div className="product-category">{product.category}</div>
        <h3>{product.name}</h3>
        <div className="price">{money(product.price)}</div>
        <button className="add" onClick={() => onAdd(product)}>Agregar al carrito</button>
      </div>
    </article>
  );
}

function CartIcon() {
  return <span className="cart-icon-svg" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6" /></svg></span>;
}

function CartDrawer({ cart, onClose, onChange, onRemove }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return (
    <div className="drawer-backdrop" onClick={event => event.target === event.currentTarget && onClose()}>
      <aside className="drawer">
        <div className="drawer-head"><h2>Tu carrito</h2><button className="close" onClick={onClose}>×</button></div>
        {!cart.length ? <div className="cart-empty">Aún no has agregado productos.<br /><br />Explora el catálogo y arma tu pedido.</div> : <>
          {cart.map(item => <div className="cart-row" key={item.id}>
            <div className="cart-icon">{item.icon}</div>
            <div><div className="cart-name">{item.name}</div><div className="cart-price">{money(item.price)}</div>
              <div className="qty"><button onClick={() => onChange(item.id, -1)}>−</button><span>{item.quantity}</span><button onClick={() => onChange(item.id, 1)}>+</button><button className="remove" onClick={() => onRemove(item.id)}>Quitar</button></div>
            </div>
            <strong>{money(item.price * item.quantity)}</strong>
          </div>)}
          <div className="cart-total"><span>Total estimado</span><span>{money(total)}</span></div>
          <a className="checkout" href={whatsappUrl(cart)} target="_blank" rel="noreferrer">Continuar por WhatsApp</a>
          <p className="checkout-note">No se realizan pagos en línea aquí. Confirmaremos disponibilidad, envío y forma de pago por WhatsApp.</p>
        </>}
      </aside>
    </div>
  );
}

export function LegacyApp() {
  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todas');
  const add = product => setCart(current => {
    const found = current.find(item => item.id === product.id);
    return found ? current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }];
  });
  const change = (id, amount) => setCart(current => current.map(item => item.id === id ? { ...item, quantity: item.quantity + amount } : item).filter(item => item.quantity > 0));
  const remove = id => setCart(current => current.filter(item => item.id !== id));
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const visibleProducts = activeCategory === 'Todas'
    ? products
    : products.filter(product => product.category === activeCategory);
  const selectCategory = category => {
    setActiveCategory(category);
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return <>
    <div className="topbar">Envíos a toda Colombia · Atención personalizada por WhatsApp</div>
    <header>
      <a className="brand" href="#inicio"><img className="brand-logo" src="/logo.webp" alt="Importaciones EBC" /><span>IMPORTACIONES EBC</span></a>
      <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}><span /><span /><span /></button>
      <nav className={menuOpen ? 'mobile-open' : ''}><a href="#productos" onClick={() => setMenuOpen(false)}>Productos</a><a href="#categorias" onClick={() => setMenuOpen(false)}>Categorías</a><a href="#como-comprar" onClick={() => setMenuOpen(false)}>Cómo comprar</a></nav>
      <button className="cart-button" onClick={() => setOpen(true)}><CartIcon />Carrito{count ? ` · ${count}` : ''}</button>
    </header>

    <section className="hero" id="inicio"><div className="hero-content"><div className="eyebrow">Importaciones EBC · USA → Colombia</div><h1>De Estados Unidos <em>para ti.</em></h1><p className="hero-copy">Encuentra productos seleccionados, arma tu pedido y déjanos coordinar contigo por WhatsApp.</p><div className="hero-actions"><a className="primary" href="#productos">Ver productos</a><a className="secondary" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">Hablar por WhatsApp</a></div></div></section>

    <main>
      <section id="categorias"><div className="section-head"><div><p className="section-kicker">Explora</p><h2>Compra por categoría</h2></div><p className="section-note">Cada categoría muestra los productos de prueba que le corresponden.</p></div><div className="category-grid">{categories.map(([className, title, note]) => <button className={`category ${className} ${activeCategory === title ? 'is-active' : ''}`} type="button" onClick={() => selectCategory(title)} key={title}><strong>{title}</strong><span>{note} · {products.filter(product => product.category === title).length} productos</span></button>)}</div></section>
      <section id="productos" className="products-section"><div className="section-head"><div><p className="section-kicker">Catálogo inicial</p><h2>{activeCategory === 'Todas' ? 'Productos destacados' : activeCategory}</h2></div><div className="catalog-tools"><p className="section-note">Precios de referencia. Confirma disponibilidad, envío y valor final directamente con nuestro equipo.</p>{activeCategory !== 'Todas' && <button className="show-all" type="button" onClick={() => setActiveCategory('Todas')}>Ver todos</button>}</div></div><div className="product-grid">{visibleProducts.map(product => <ProductCard key={product.id} product={product} onAdd={product => { add(product); setOpen(true); }} />)}</div></section>
      <section className="trust" id="como-comprar">{[['✓', 'Productos seleccionados', 'Revisamos contigo la disponibilidad antes de confirmar.'], ['✈', 'Envíos a Colombia', 'Coordinamos la entrega y los detalles por WhatsApp.'], ['◉', 'Compra acompañada', 'Tu pedido se gestiona de forma directa y personalizada.']].map(([icon, title, note]) => <div className="trust-item" key={title}><div className="trust-icon">{icon}</div><b>{title}</b><span>{note}</span></div>)}</section>
      <section className="callout"><div><p className="section-kicker">¿Buscas algo específico?</p><h2>Lo importamos para ti.</h2><p>Escríbenos por WhatsApp y cuéntanos qué producto estás buscando. Te ayudamos a revisar opciones y disponibilidad.</p><a className="whatsapp" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">◉&nbsp; Escribir por WhatsApp</a></div><div className="callout-art" /></section>
    </main>
    <footer><span className="footer-brand">IMPORTACIONES EBC</span><span>De Estados Unidos para ti · Pedidos por WhatsApp</span></footer>
    {open && <CartDrawer cart={cart} onClose={() => setOpen(false)} onChange={change} onRemove={remove} />}
  </>;
}

export { default } from './Storefront.jsx';
