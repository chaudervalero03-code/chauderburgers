import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  ChevronRight, 
  Sparkles, 
  Check, 
  Utensils, 
  Info, 
  RefreshCw,
  Search,
  MessageCircle,
  Flame,
  Star
} from 'lucide-react';

const LOGO_URL = 'https://i.ibb.co/vzGnm3H/chauder-burgers-logo-transparente.png';

// High quality product menu matching Chauder Burgers real sheet structure & COP prices
const FALLBACK_MENU = [
  {
    id: '1',
    categoria: 'Hamburguesas',
    nombre: 'Tequila',
    descripcion: 'Carne jugosa, queso fundido, tocineta crocante y nuestra salsa especial de la casa.',
    precio_sencilla: 15900,
    precio_doble: 19900,
    imagen: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    destacado: true
  },
  {
    id: '2',
    categoria: 'Hamburguesas',
    nombre: 'Clásica',
    descripcion: 'Carne artesanal estilo americano, doble queso americano, pepinillos encurtidos y salsa artesanal.',
    precio_sencilla: 13990,
    precio_doble: 17990,
    imagen: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
    destacado: true
  },
  {
    id: '3',
    categoria: 'Hamburguesas',
    nombre: 'Piña Grill',
    descripcion: 'Carne a la parrilla, piña asada glaseada, queso Pepper Jack y tocineta ahumada.',
    precio_sencilla: 15900,
    precio_doble: 19900,
    imagen: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    destacado: false
  },
  {
    id: '4',
    categoria: 'Hamburguesas',
    nombre: 'Special',
    descripcion: 'Combinación especial Chauder con mermelada de cebolla, queso cheddar y tocineta.',
    precio_sencilla: 15900,
    precio_doble: 19900,
    imagen: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80',
    destacado: false
  },
  {
    id: '5',
    categoria: 'Hamburguesas',
    nombre: 'Argentina',
    descripcion: 'Carne a la parrilla con chimichurri casero, queso mozzarella fundido y cebolla crispy.',
    precio_sencilla: 16900,
    precio_doble: 20900,
    imagen: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
    destacado: true
  },
  {
    id: '6',
    categoria: 'Adicionales',
    nombre: 'Combo Papas + Gaseosa',
    descripcion: 'Porción de papas crujientes doradas más gaseosa pet bien fría.',
    precio_sencilla: 6000,
    precio_doble: null,
    imagen: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
    destacado: false
  }
];

// Google Sheet Direct Export Link
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1OtGYOIMM9qEBKyMlxfWYin-_n_oo3iCs_tJlWzpRv6o/export?format=csv';

// Format COP currency (e.g. 15900 -> "$15.900")
const formatCOP = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount) || amount <= 0) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount).replace('COP', '$').trim();
};

// Helper function to safely parse price values from numeric, string, or COP dotted format ("15.900" -> 15900)
const parsePriceValue = (val) => {
  if (val === undefined || val === null) return null;
  const strVal = String(val).trim();
  
  if (!strVal || strVal === '-' || strVal.toLowerCase() === 'null' || strVal.toLowerCase() === 'undefined') {
    return null;
  }

  let cleanStr = strVal.replace(/[$]/g, '').replace(/\s+/g, '');
  if (cleanStr.includes('.') && !cleanStr.includes(',')) {
    cleanStr = cleanStr.replace(/\./g, '');
  } else if (cleanStr.includes('.')) {
    cleanStr = cleanStr.replace(/\./g, '');
  }
  
  const num = parseFloat(cleanStr);
  return isNaN(num) || num <= 0 ? null : num;
};

// Robust CSV parser handling quotes, line breaks, and whitespace
const parseCSV = (csvText) => {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return { headers: [], items: [] };

  const rawHeaders = rows[0];
  const items = [];

  for (let i = 1; i < rows.length; i++) {
    const rowValues = rows[i];
    const rowObj = {};
    rawHeaders.forEach((header, colIdx) => {
      const val = rowValues[colIdx] ? rowValues[colIdx].replace(/^"|"$/g, '').trim() : '';
      rowObj[header] = val;
    });
    items.push(rowObj);
  }

  return { headers: rawHeaders, items };
};

// Helper to sanitize key lookup (e.g. "Descripción" -> "descripcion", "Precio Doble Carne" -> "preciodoblecarne")
const normalizeKey = (key) => {
  return String(key || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
};

// Safe field extractor from row object matching canonical headers
const getFieldValue = (rowObj, possibleKeys) => {
  if (!rowObj) return '';
  const normalizedRowObj = {};
  Object.keys(rowObj).forEach(k => {
    normalizedRowObj[normalizeKey(k)] = rowObj[k];
  });

  for (const pKey of possibleKeys) {
    const normKey = normalizeKey(pKey);
    if (normalizedRowObj[normKey] !== undefined && normalizedRowObj[normKey] !== '') {
      return normalizedRowObj[normKey];
    }
  }
  return '';
};

export default function App() {
  const [products, setProducts] = useState(FALLBACK_MENU);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('sencilla'); // 'sencilla' | 'doble'
  const [modalQuantity, setModalQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState('cache');
  const [customerNotes, setCustomerNotes] = useState('');

  const fetchSheetData = async () => {
    setLoading(true);
    try {
      const response = await fetch(GOOGLE_SHEET_CSV_URL);
      if (!response.ok) throw new Error('Network error loading Sheet');
      const csvText = await response.text();
      
      const parsed = parseCSV(csvText);
      if (parsed.items && parsed.items.length > 0) {
        const mappedProducts = parsed.items.map((item, idx) => {
          const nombre = getFieldValue(item, ['Nombre', 'Producto', 'Item']);
          const categoria = getFieldValue(item, ['Categoría', 'Categoria', 'Sección']) || 'General';
          const descripcion = getFieldValue(item, ['Descripción', 'Descripcion', 'Detalle']);
          
          const rawSencilla = getFieldValue(item, ['Precio Sencilla', 'Sencilla', 'Precio']);
          const rawDoble = getFieldValue(item, ['Precio Doble Carne', 'Precio Doble', 'Doble']);

          const precio_sencilla = parsePriceValue(rawSencilla);
          const precio_doble = parsePriceValue(rawDoble);

          const imagen = getFieldValue(item, ['Imagen', 'Foto', 'URL']) || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80';

          return {
            id: `sheet-${idx}`,
            nombre,
            categoria,
            descripcion,
            precio_sencilla,
            precio_doble,
            imagen,
            destacado: idx < 3
          };
        }).filter(p => p.nombre && (p.precio_sencilla !== null || p.precio_doble !== null));

        if (mappedProducts.length > 0) {
          setProducts(mappedProducts);
          setDataSource('sheet');
        }
      }
    } catch (error) {
      console.warn('Could not fetch live Google Sheet, using synchronized menu fallback.', error);
      setProducts(FALLBACK_MENU);
      setDataSource('cache');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheetData();
  }, []);

  useEffect(() => {
    const uniqueCats = ['Todas', ...new Set(products.map(p => p.categoria.trim()).filter(Boolean))];
    setCategories(uniqueCats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = activeCategory === 'Todas' || product.categoria === activeCategory;
      const matchesSearch = product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
    if (product.precio_sencilla) {
      setSelectedVariant('sencilla');
    } else if (product.precio_doble) {
      setSelectedVariant('doble');
    } else {
      setSelectedVariant('sencilla');
    }
    setModalQuantity(1);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const isDoble = selectedVariant === 'doble' && selectedProduct.precio_doble !== null;
    const unitPrice = isDoble ? selectedProduct.precio_doble : (selectedProduct.precio_sencilla || selectedProduct.precio_doble);

    if (!unitPrice) return;

    const variantKey = isDoble ? 'doble' : 'sencilla';
    const cartItemId = `${selectedProduct.id}-${variantKey}`;

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += modalQuantity;
        return updated;
      } else {
        return [...prevCart, {
          cartItemId,
          id: selectedProduct.id,
          nombre: selectedProduct.nombre,
          variant: variantKey,
          unitPrice,
          quantity: modalQuantity,
          imagen: selectedProduct.imagen
        }];
      }
    });

    setSelectedProduct(null);
  };

  const updateCartQuantity = (cartItemId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.cartItemId === cartItemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const cartTotalCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartTotalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }, [cart]);

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    let message = `*¡Hola Chauder Burgers!* 🍔\nQuiero realizar el siguiente pedido desde el Menú Digital:\n\n`;

    cart.forEach((item) => {
      const variantText = item.variant === 'doble' ? ' (DOBLE CARNE)' : (item.variant === 'sencilla' ? ' (SENCILLA)' : '');
      message += `• *${item.quantity}x ${item.nombre}${variantText}* - ${formatCOP(item.unitPrice * item.quantity)}\n`;
    });

    message += `\n*TOTAL A PAGAR:* ${formatCOP(cartTotalPrice)}`;
    if (customerNotes.trim()) {
      message += `\n\n*Notas / Observaciones:* ${customerNotes.trim()}`;
    }
    message += `\n\n¡Quedo atento a su confirmación!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F1E6C5] text-slate-900 font-sans antialiased selection:bg-[#B52B20] selection:text-white overflow-x-hidden pb-32">
      
      {/* Sticky Header with 100% horizontal overflow protection */}
      <header className="sticky top-0 z-30 bg-[#F1E6C5]/95 backdrop-blur-md border-b-2 border-[#064B9B]/15 shadow-sm w-full">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2.5 min-w-0">
            <img 
              src={LOGO_URL} 
              alt="Chauder Burgers" 
              className="w-11 h-11 sm:w-14 sm:h-14 object-contain rounded-full shadow-sm border-2 border-[#B52B20] bg-[#F1E6C5] flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h1 className="font-black text-xl sm:text-2xl md:text-3xl tracking-tight text-[#064B9B] uppercase font-mono leading-none truncate">
                CHAUDER <span className="text-[#B52B20]">BURGERS</span>
              </h1>
              <p className="text-[10px] sm:text-xs font-bold text-[#064B9B]/80 tracking-wide mt-0.5 uppercase truncate">
                American Style • Menú Interactivo
              </p>
            </div>
          </div>

          <button 
            onClick={fetchSheetData}
            title="Sincronizar carta"
            className="w-11 h-11 rounded-full hover:bg-[#064B9B]/10 active:bg-[#064B9B]/20 text-[#064B9B] transition-colors flex items-center justify-center flex-shrink-0 touch-manipulation"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-[#B52B20]' : ''}`} />
          </button>
        </div>

        {/* Horizontal Scrollable Categories with touch scroll */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-1.5 pb-2.5 overflow-x-auto no-scrollbar flex items-center gap-2 border-t border-[#064B9B]/10 touch-pan-x">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-2 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 shadow-sm border flex items-center justify-center touch-manipulation ${
                  isActive 
                    ? 'bg-[#064B9B] text-[#F1E6C5] border-[#064B9B] shadow-md scale-105' 
                    : 'bg-white/90 text-[#064B9B] border-[#064B9B]/20 hover:bg-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </header>

      {}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-3.5">
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por antojo o ingrediente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/95 border border-[#064B9B]/20 rounded-2xl pl-10 pr-10 py-2.5 min-h-[44px] text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#064B9B] transition-all shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Section Heading */}
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="text-base sm:text-lg font-black text-[#064B9B] uppercase tracking-wide flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-[#B52B20] flex-shrink-0" />
            {activeCategory === 'Todas' ? 'Nuestra Carta' : activeCategory}
          </h2>
          <span className="text-xs font-bold text-slate-600">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'opción' : 'opciones'}
          </span>
        </div>

        {/* Product Cards Grid: 1 col on mobile (320px-430px), 2 cols on tablet/desktop */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white/60 rounded-3xl p-6 sm:p-8 text-center border-2 border-dashed border-[#064B9B]/20 my-6">
            <Utensils className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-slate-600 font-medium text-sm">No se encontraron productos en esta sección.</p>
            <button 
              onClick={() => { setActiveCategory('Todas'); setSearchQuery(''); }}
              className="mt-3 min-h-[44px] px-4 py-2 text-xs font-bold text-[#064B9B] underline uppercase tracking-wider touch-manipulation"
            >
              Ver todo el menú
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const hasSencilla = product.precio_sencilla !== null;
              const hasDoble = product.precio_doble !== null;

              return (
                <div
                  key={product.id}
                  onClick={() => handleOpenProduct(product)}
                  className="group bg-white rounded-2xl p-2.5 sm:p-3 border border-[#064B9B]/15 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-2.5 sm:gap-3 relative overflow-hidden active:bg-slate-50 touch-manipulation"
                >
                  {/* Compact 80px thumbnail on mobile, 96px on desktop */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                    <img
                      src={product.imagen}
                      alt={product.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight group-hover:text-[#064B9B] transition-colors truncate">
                        {product.nombre}
                      </h3>
                      
                      {/* Description truncated to 2 lines for list view without losing full content in modal */}
                      <p className="text-[#0f2c59] text-[11px] sm:text-xs font-normal mt-0.5 line-clamp-2 leading-tight tracking-tight">
                        {product.descripcion}
                      </p>
                    </div>

                    {/* Pricing & Quick Add Button */}
                    <div className="mt-1.5 flex items-end justify-between gap-1">
                      <div className="flex flex-col">
                        {hasSencilla && hasDoble ? (
                          <div className="text-[11px] sm:text-xs font-black text-slate-900 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5 leading-none">
                            <span className="text-[#B52B20]">Sencilla {formatCOP(product.precio_sencilla)}</span>
                            <span className="text-[#064B9B]">Doble {formatCOP(product.precio_doble)}</span>
                          </div>
                        ) : hasSencilla ? (
                          <span className="font-extrabold text-[#B52B20] text-xs sm:text-sm leading-none">
                            {formatCOP(product.precio_sencilla)}
                          </span>
                        ) : hasDoble ? (
                          <span className="font-extrabold text-[#064B9B] text-xs sm:text-sm leading-none">
                            Doble {formatCOP(product.precio_doble)}
                          </span>
                        ) : null}
                      </div>

                      {/* Explicit 44x44px Minimum Touch Target Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProduct(product);
                        }}
                        aria-label={`Añadir ${product.nombre}`}
                        className="w-11 h-11 rounded-full bg-[#064B9B] text-[#F1E6C5] flex items-center justify-center shadow active:scale-95 group-hover:bg-[#B52B20] transition-all flex-shrink-0 touch-manipulation"
                      >
                        <Plus className="w-5 h-5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="bg-[#F1E6C5] w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border-t-2 sm:border-2 border-[#064B9B] max-h-[90vh] flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image & Close Button */}
            <div className="relative h-48 sm:h-60 bg-slate-900 flex-shrink-0">
              <img
                src={selectedProduct.imagen}
                alt={selectedProduct.nombre}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProduct(null)}
                aria-label="Cerrar modal"
                className="absolute top-3 right-3 w-11 h-11 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-black transition-colors touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[#F1E6C5] to-transparent" />
            </div>

            {/* Modal Details */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#064B9B] bg-[#064B9B]/10 px-2.5 py-1 rounded-full">
                  {selectedProduct.categoria}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 uppercase leading-tight">
                  {selectedProduct.nombre}
                </h2>
                {/* Full unabbreviated description */}
                <p className="text-[#0f2c59] text-xs sm:text-sm font-normal mt-1.5 leading-relaxed">
                  {selectedProduct.descripcion}
                </p>
              </div>

              {/* Mandatory Variant Selector BEFORE adding to cart */}
              {selectedProduct.precio_sencilla !== null && selectedProduct.precio_doble !== null ? (
                <div className="space-y-2 pt-2.5 border-t border-[#064B9B]/15">
                  <label className="text-xs font-black uppercase text-[#064B9B] tracking-wider block">
                    Selecciona tamaño/variante:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedVariant('sencilla')}
                      className={`p-3 min-h-[52px] rounded-2xl border-2 font-bold text-left transition-all touch-manipulation flex flex-col justify-center ${
                        selectedVariant === 'sencilla'
                          ? 'border-[#B52B20] bg-white text-slate-900 shadow-md ring-2 ring-[#B52B20]/20'
                          : 'border-slate-300/80 bg-white/60 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-extrabold text-slate-500">Sencilla</div>
                      <div className="text-sm sm:text-base font-black text-[#B52B20]">
                        {formatCOP(selectedProduct.precio_sencilla)}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedVariant('doble')}
                      className={`p-3 min-h-[52px] rounded-2xl border-2 font-bold text-left transition-all touch-manipulation flex flex-col justify-center ${
                        selectedVariant === 'doble'
                          ? 'border-[#064B9B] bg-white text-slate-900 shadow-md ring-2 ring-[#064B9B]/20'
                          : 'border-slate-300/80 bg-white/60 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-extrabold text-[#064B9B]">Doble Carne</div>
                      <div className="text-sm sm:text-base font-black text-[#064B9B]">
                        {formatCOP(selectedProduct.precio_doble)}
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2.5 border-t border-[#064B9B]/15 flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#064B9B]">Precio</span>
                  <span className="text-lg font-black text-[#B52B20]">
                    {formatCOP(selectedProduct.precio_sencilla || selectedProduct.precio_doble)}
                  </span>
                </div>
              )}

              {/* Quantity Selection */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[#064B9B]/15">
                <span className="text-xs font-black uppercase text-slate-700">Cantidad</span>
                <div className="flex items-center gap-3 bg-white rounded-full p-1 border border-[#064B9B]/30 shadow-inner">
                  <button
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    disabled={modalQuantity <= 1}
                    className="w-11 h-11 rounded-full bg-slate-100 active:bg-slate-200 text-slate-800 flex items-center justify-center transition-colors disabled:opacity-40 touch-manipulation"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-black text-base min-w-[24px] text-center text-slate-900">
                    {modalQuantity}
                  </span>
                  <button
                    onClick={() => setModalQuantity(modalQuantity + 1)}
                    className="w-11 h-11 rounded-full bg-[#064B9B] active:bg-[#064B9B]/90 text-white flex items-center justify-center transition-colors touch-manipulation"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Add CTA */}
            <div className="p-3.5 sm:p-4 bg-white border-t border-[#064B9B]/15">
              <button
                onClick={handleAddToCart}
                className="w-full bg-[#B52B20] active:bg-[#962219] text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-between shadow-lg transition-transform active:scale-[0.99] touch-manipulation min-h-[48px]"
              >
                <span className="uppercase text-xs sm:text-sm tracking-wider">Añadir al Pedido</span>
                <span className="text-sm sm:text-base">
                  {formatCOP(
                    (selectedVariant === 'doble' && selectedProduct.precio_doble !== null
                      ? selectedProduct.precio_doble 
                      : (selectedProduct.precio_sencilla || selectedProduct.precio_doble)) * modalQuantity
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {/* Floating Bottom Cart (Responsive to Mobile Safe Areas and non-blocking) */}
      {cartTotalCount > 0 && !isCartOpen && (
        <div className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom,16px)] pt-2 px-3 sm:px-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-[#064B9B] text-[#F1E6C5] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-2xl border-2 border-[#F1E6C5] active:bg-[#053d7e] transition-all touch-manipulation group min-h-[56px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative bg-[#B52B20] text-white p-2 rounded-xl flex-shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -top-2 -right-2 bg-white text-[#B52B20] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#064B9B] shadow">
                    {cartTotalCount}
                  </span>
                </div>
                <div className="text-left leading-none">
                  <div className="text-[10px] uppercase font-black text-[#F1E6C5]/80">Ver pedido</div>
                  <div className="text-xs sm:text-sm font-black tracking-wide mt-0.5">
                    {cartTotalCount} {cartTotalCount === 1 ? 'producto' : 'productos'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white bg-[#064B9B]/60 px-2.5 py-1 rounded-xl border border-white/20">
                  {formatCOP(cartTotalPrice)}
                </span>
                <ChevronRight className="w-5 h-5 text-[#F1E6C5]" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsCartOpen(false)}
        >
          <div 
            className="bg-[#F1E6C5] w-full max-w-lg rounded-t-3xl overflow-hidden shadow-2xl border-t-2 border-[#064B9B] max-h-[85vh] flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-3.5 sm:p-4 bg-[#064B9B] text-[#F1E6C5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#B52B20]" />
                <h2 className="font-black text-base sm:text-lg uppercase tracking-wider">Tu Pedido Chauder</h2>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                aria-label="Cerrar pedido"
                className="w-11 h-11 rounded-full hover:bg-white/10 active:bg-white/20 text-white flex items-center justify-center transition-colors touch-manipulation"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Item List */}
            <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 space-y-2.5">
              {cart.map((item) => (
                <div 
                  key={item.cartItemId}
                  className="bg-white rounded-2xl p-2.5 flex items-center gap-2.5 border border-[#064B9B]/10 shadow-sm"
                >
                  <img 
                    src={item.imagen} 
                    alt={item.nombre} 
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                      {item.nombre}
                    </h4>
                    <p className="text-[10px] font-bold text-[#064B9B] uppercase">
                      {item.variant === 'doble' ? 'Doble Carne' : 'Sencilla'}
                    </p>
                    <div className="font-black text-[#B52B20] text-xs">
                      {formatCOP(item.unitPrice * item.quantity)}
                    </div>
                  </div>

                  {/* Accessible Quantity Controls */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-shrink-0">
                    <button
                      onClick={() => updateCartQuantity(item.cartItemId, -1)}
                      className="w-9 h-9 rounded-lg bg-white active:bg-slate-200 text-slate-800 flex items-center justify-center font-bold shadow-sm touch-manipulation"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-xs min-w-[16px] text-center text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.cartItemId, 1)}
                      className="w-9 h-9 rounded-lg bg-[#064B9B] active:bg-[#064B9B]/90 text-white flex items-center justify-center font-bold shadow-sm touch-manipulation"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Special Instructions */}
              <div className="pt-2">
                <label className="block text-xs font-black uppercase text-[#064B9B] mb-1">
                  Notas para la cocina:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Sin cebolla, extra salsa, papas bien doradas..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full bg-white border border-[#064B9B]/20 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#064B9B]"
                />
              </div>
            </div>

            {/* Cart Footer */}
            <div className="p-3.5 sm:p-4 bg-white border-t border-[#064B9B]/15 space-y-2.5">
              <div className="flex items-center justify-between text-[#064B9B] font-black text-base sm:text-lg">
                <span className="uppercase text-xs sm:text-sm">Total a Pagar</span>
                <span className="text-lg sm:text-xl text-[#B52B20]">{formatCOP(cartTotalPrice)}</span>
              </div>

              <button
                onClick={handleWhatsAppCheckout}
                className="w-full bg-[#25D366] active:bg-[#20bd5a] text-white font-black py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99] uppercase text-xs sm:text-sm tracking-wider min-h-[48px] touch-manipulation"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                Enviar Pedido por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}