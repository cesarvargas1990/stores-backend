import { hashPassword, cleanUrl } from './security.js';
import { id, now } from './store.js';

const image = (name) => cleanUrl(process.env.EBC_ASSET_BASE ? `${process.env.EBC_ASSET_BASE}/${name}` : `https://importacionesebc.store/${name}`);

export function seed() {
  const createdAt = now();
  const tech = id(), moda = id(), belleza = id(), hogar = id(), viaje = id();
  const storeId = id();
  return {
    version: 1,
    stores: [{ id: storeId, name: 'Importaciones EBC', slug: 'importaciones-ebc', origin: process.env.EBC_STORE_ORIGIN || 'https://importacionesebc.store', apiKey: process.env.EBC_API_KEY || 'ebc-initial-key-change-me', active: true, createdAt, updatedAt: createdAt }],
    users: [
      { id: id(), email: (process.env.MASTER_EMAIL || 'cesara.vargas1990@gmail.com').toLowerCase(), passwordHash: hashPassword(process.env.MASTER_PASSWORD || 'change-this-master-password'), role: 'master', storeIds: ['*'], createdAt },
      { id: id(), email: (process.env.EBC_EMAIL || 'bedoyacorreaestefania@gmail.com').toLowerCase(), passwordHash: hashPassword(process.env.EBC_PASSWORD || 'change-this-store-password'), role: 'store_admin', storeIds: [storeId], createdAt }
    ],
    categories: [
      { id: tech, name: 'Tecnología', description: 'Gadgets y accesorios', imageUrl: image('category-tecnologia.webp'), active: true, sortOrder: 1, createdAt, updatedAt: createdAt },
      { id: moda, name: 'Moda', description: 'Estilo para cada día', imageUrl: image('category-moda.webp'), active: true, sortOrder: 2, createdAt, updatedAt: createdAt },
      { id: belleza, name: 'Belleza', description: 'Cuidado personal', imageUrl: image('category-belleza.webp'), active: true, sortOrder: 3, createdAt, updatedAt: createdAt },
      { id: hogar, name: 'Hogar', description: 'Soluciones prácticas', imageUrl: image('category-hogar.webp'), active: true, sortOrder: 4, createdAt, updatedAt: createdAt },
      { id: viaje, name: 'Viaje', description: 'Accesorios para moverte', imageUrl: '', active: true, sortOrder: 5, createdAt, updatedAt: createdAt }
    ].map((category) => ({ ...category, storeId })),
    products: [
      ['Audífonos inalámbricos Pro', tech, 189900, '🎧'], ['Tenis urbanos', moda, 249900, '👟'], ['Termo térmico premium', hogar, 119900, '🥤'], ['Parlante portátil Bluetooth', tech, 169900, '🔊'], ['Set de cuidado personal', belleza, 139900, '✨'], ['Accesorio organizador de viaje', viaje, 89900, '🧳'], ['Lámpara LED para escritorio', hogar, 129900, '💡'], ['Gadget inteligente para casa', tech, 219900, '🏠']
    ].map(([name, categoryId, price, fallback], index) => ({ id: id(), storeId, name, description: '', categoryId, price, previousPrice: null, imageUrl: '', gallery: [], active: true, available: true, featured: index < 4, badge: '', sku: '', stock: null, fallback, sortOrder: index + 1, createdAt, updatedAt: createdAt })),
    settings: [{ storeId, storeName: 'Importaciones EBC', logoUrl: image('logo.png'), heroImageUrl: image('hero.webp'), topbarText: 'Envíos a toda Colombia · Atención personalizada por WhatsApp', heroEyebrow: 'Importaciones EBC · USA → Colombia', heroTitle: 'De Estados Unidos para ti.', heroDescription: 'Encuentra productos seleccionados, arma tu pedido y déjanos coordinar contigo por WhatsApp.', primaryButtonText: 'Ver productos', secondaryButtonText: 'Hablar por WhatsApp', locationTitle: 'Ubicación', locationAddress: 'Cr 8 #7-39, barrio Obrero, Calima-Darién', whatsappNumber: '573189330624', whatsappMessage: 'Hola, Importaciones EBC. Quiero solicitar este pedido y confirmar disponibilidad, envío y forma de pago:', whatsappGreeting: 'Hola, Importaciones EBC. Quiero conocer sus productos y recibir asesoría, por favor.', shippingNotice: 'Precios de referencia. Confirma disponibilidad, envío y valor final directamente con nuestro equipo.', purchaseInstructions: 'No se realizan pagos en línea aquí. Confirmaremos disponibilidad, envío y forma de pago por WhatsApp.', currency: 'COP', fractionDigits: 0, featuredTitle: 'Productos destacados', calloutTitle: 'Lo importamos para ti.', calloutText: 'Escríbenos por WhatsApp y cuéntanos qué producto estás buscando. Te ayudamos a revisar opciones y disponibilidad.', updatedAt: createdAt }]
  };
}
