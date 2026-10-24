import React, { useEffect, useState, useMemo } from 'react';
import {
  ShoppingBag,
  Flame,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Tv,
  UtensilsCrossed,
  Sparkles,
  QrCode,
  Search,
  ArrowUpRight,
  Check,
  History,
  Star,
  Receipt,
  PartyPopper,
  Crown,
  Menu as MenuIcon,
  X,
  Compass,
  Calendar,
  UserCheck,
  UserPlus,
  ArrowRight,
  Heart,
  ChevronRight,
  Lock,
  Bot,
  Tag,
  Percent
} from 'lucide-react';
import { Location, MenuItem, Order } from './types/models';
import { api } from './services/api';
import { DishDetailModal } from './components/DishDetailModal';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { DigitalBillModal } from './components/DigitalBillModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { CustomerFeedbackModal } from './components/CustomerFeedbackModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { BookEventModal } from './components/BookEventModal';
import { LoyaltyModal } from './components/LoyaltyModal';
import { BecomeMemberModal } from './components/BecomeMemberModal';
import { StaffLoginModal } from './components/StaffLoginModal';
import { VenueSelectModal } from './components/VenueSelectModal';
import { LocationMap } from './components/LocationMap';
import { KitchenDisplay } from './components/KitchenDisplay';
import { CashierDashboard } from './components/CashierDashboard';
import { CollectionTV } from './components/CollectionTV';
import { AdminPanel } from './components/AdminPanel';
import { GeminiChatBot } from './components/GeminiChatBot';

export function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');

  // Gemini AI Chatbot state
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Table QR Detection from URL
  const [tableParam, setTableParam] = useState<string | null>(null);

  // User & Loyalty state
  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('shangrilla_customer_phone')) || '';
  });
  const [customerName, setCustomerName] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('shangrilla_customer_name')) || '';
  });
  const [pastOrders, setPastOrders] = useState<Order[]>([]);

  // Navigation & Drawer states
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Modals
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [activeBillOrder, setActiveBillOrder] = useState<Order | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isBookEventOpen, setIsBookEventOpen] = useState<boolean>(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState<boolean>(false);
  const [isBecomeMemberOpen, setIsBecomeMemberOpen] = useState<boolean>(false);
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState<boolean>(false);
  const [isVenueSelectOpen, setIsVenueSelectOpen] = useState<boolean>(false);
  const [isInitialVenuePrompt, setIsInitialVenuePrompt] = useState<boolean>(false);

  // Operational View Modes (Password Protected)
  const [currentView, setCurrentView] = useState<'customer' | 'kitchen' | 'cashier' | 'tv' | 'admin'>('customer');

  // Load locations and menu
  useEffect(() => {
    async function init() {
      try {
        const locs = await api.getLocations();
        setLocations(locs);

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const locParam = params.get('location');
          const tParam = params.get('table');
          if (tParam) setTableParam(tParam);

          const savedVenueId = localStorage.getItem('shangrilla_selected_venue');

          if (locs.length > 0) {
            if (locParam) {
              const matched = locs.find(l => l.id === locParam);
              setActiveLocation(matched || locs[0]);
            } else if (savedVenueId) {
              const matched = locs.find(l => l.id === savedVenueId);
              setActiveLocation(matched || locs[0]);
            } else {
              // Default to primary location without any arrival popup
              setActiveLocation(locs[0]);
              setIsInitialVenuePrompt(false);
              setIsVenueSelectOpen(false);
            }
          }
        } else if (locs.length > 0) {
          setActiveLocation(locs[0]);
        }

        const menu = await api.getMenu();
        setMenuItems(menu);

        const cats = Array.from(new Set(menu.map(m => m.category)));
        setCategories(['All', 'Featured', ...cats]);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  // Update menu when location changes
  useEffect(() => {
    if (!activeLocation) return;
    api.getMenu(activeLocation.id).then(menu => {
      setMenuItems(menu);
      const cats = Array.from(new Set(menu.map(m => m.category)));
      setCategories(['All', 'Featured', ...cats]);
    });
  }, [activeLocation]);

  // Fetch past orders for personalized recommendations if customer has saved phone
  useEffect(() => {
    if (!customerPhone) return;
    api.getOrders({ phone: customerPhone })
      .then(ords => {
        setPastOrders(ords);
      })
      .catch(() => {});
  }, [customerPhone]);

  const handleVenueSelected = (loc: Location) => {
    setActiveLocation(loc);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shangrilla_selected_venue', loc.id);
    }
    setIsVenueSelectOpen(false);
    setIsInitialVenuePrompt(false);
  };

  // Cart operations
  const handleAddToCart = (
    item: MenuItem,
    quantity: number,
    selectedAddonIds: string[],
    specialInstructions?: string
  ) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(
        c =>
          c.item.id === item.id &&
          c.specialInstructions === specialInstructions &&
          JSON.stringify(c.selectedAddonIds.sort()) === JSON.stringify(selectedAddonIds.sort())
      );
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        return copy;
      }
      return [...prev, { item, quantity, selectedAddonIds, specialInstructions }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (idx: number, qty: number) => {
    setCart(prev => {
      const copy = [...prev];
      copy[idx].quantity = qty;
      return copy;
    });
  };

  const handleRemoveFromCart = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const totalCartCount = cart.reduce((s, it) => s + it.quantity, 0);

  // Personalized dish recommendations algorithm
  const recommendedDishes = useMemo(() => {
    if (menuItems.length === 0) return [];

    if (pastOrders.length > 0) {
      // Analyze user's order history
      const orderedCount = new Map<string, number>();
      const orderedCategories = new Map<string, number>();

      for (const ord of pastOrders) {
        for (const it of ord.items) {
          orderedCount.set(it.menuItemId, (orderedCount.get(it.menuItemId) || 0) + it.quantity);
          const dishObj = menuItems.find(m => m.id === it.menuItemId);
          if (dishObj) {
            orderedCategories.set(dishObj.category, (orderedCategories.get(dishObj.category) || 0) + 1);
          }
        }
      }

      // Past dishes ordered
      const pastFavs = menuItems
        .filter(m => orderedCount.has(m.id))
        .sort((a, b) => (orderedCount.get(b.id) || 0) - (orderedCount.get(a.id) || 0));

      // Category matches
      const favoriteCat = Array.from(orderedCategories.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
      const categoryRecs = favoriteCat
        ? menuItems.filter(m => m.category === favoriteCat && !orderedCount.has(m.id))
        : [];

      const combined = [...pastFavs, ...categoryRecs];
      if (combined.length >= 4) return combined.slice(0, 4);
    }

    // Default signature crowd-pleasers
    const featured = menuItems.filter(m => m.isFeatured);
    return featured.length >= 4 ? featured.slice(0, 4) : menuItems.slice(0, 4);
  }, [menuItems, pastOrders]);

  // Filtered menu
  const filteredDishes = menuItems.filter(dish => {
    const matchesCategory =
      activeCategory === 'All'
        ? true
        : activeCategory === 'Featured'
        ? dish.isFeatured
        : dish.category === activeCategory;
    const matchesVeg = !vegOnly || dish.isVeg;
    const matchesSearch =
      !searchQuery.trim() ||
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dish.hindiName && dish.hindiName.includes(searchQuery)) ||
      dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesVeg && matchesSearch;
  });

  // Operational View Switching (Protected)
  if (currentView === 'kitchen') {
    return <KitchenDisplay locations={locations} onExit={() => setCurrentView('customer')} />;
  }
  if (currentView === 'cashier') {
    return <CashierDashboard locations={locations} onExit={() => setCurrentView('customer')} />;
  }
  if (currentView === 'tv') {
    return <CollectionTV locations={locations} onExit={() => setCurrentView('customer')} />;
  }
  if (currentView === 'admin') {
    return (
      <AdminPanel
        locations={locations}
        onExit={() => setCurrentView('customer')}
        onOpenTableOrdering={(url) => {
          window.location.href = url;
        }}
      />
    );
  }

  // Curated culinary imagery
  const galleryStrip = [
    {
      title: 'Refreshing Mango Saffron Cooler',
      category: 'Signature Drinks',
      imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=600&q=80'
    },
    {
      title: 'Hazratganj Royal Dining Hall',
      category: 'Ambience',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'
    },
    {
      title: 'Melt-in-Mouth Awadhi Starters',
      category: 'Plated Appetizer',
      imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80'
    },
    {
      title: 'Charcoal Tandoor Live Grill',
      category: 'Live Fire',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80'
    },
    {
      title: 'Master Bawarchis Open Kitchen',
      category: 'Kitchen Craft',
      imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80'
    },
    {
      title: 'Herb Crusted Succulent Chops',
      category: 'Mughlai Main',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'
    },
    {
      title: 'Royal Shahi Awadhi Mithai',
      category: 'Desserts',
      imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=600&q=80'
    }
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#cba158]/30 selection:text-black flex flex-col">
      {/* 1. FLOATING GLASSMORPHISM SEARCH BAR & TOP NAVIGATION WITH HAMBURGER MENU */}
      {/* 1. FLOATING GLASSMORPHISM SEARCH BAR & TOP NAVIGATION WITH LEFT HAMBURGER MENU */}
      <div className="fixed top-4 inset-x-0 z-40 flex justify-center px-3 sm:px-4 pointer-events-none">
        <header className="pointer-events-auto w-full max-w-5xl glass-white-nav rounded-2xl px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 sm:gap-4 shadow-[0_15px_35px_rgba(0,0,0,0.06)] border border-stone-200/90 transition-all">
          {/* Left Section: Apple-Style Hamburger Menu Button + Brand Wordmark */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Hamburger Menu Toggle Button on the LEFT */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="p-2 text-stone-700 hover:text-stone-900 bg-stone-100/90 hover:bg-stone-200/80 active:scale-90 rounded-xl border border-stone-200 transition-all apple-press shadow-xs flex items-center justify-center cursor-pointer"
              aria-label="Toggle navigation menu"
              title="Open Navigation Menu"
            >
              <MenuIcon className={`w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isMobileDrawerOpen ? 'rotate-90' : 'rotate-0'}`} />
            </button>

            {/* Brand Wordmark */}
            <a href="/" className="flex items-center gap-2 group shrink-0 apple-press">
              <span className="font-['Oswald',sans-serif] font-bold text-xl sm:text-2xl text-stone-900 tracking-wider uppercase group-hover:text-[#b8860b] transition-colors">
                SHANGRILLA
              </span>
            </a>
          </div>

          {/* Integrated Glassmorphism Search Bar */}
          <div className="relative flex-1 max-w-xs hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-stone-100/90 hover:bg-stone-100 focus:bg-white border border-stone-200 focus:border-[#cba158] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#cba158]/20 transition-all backdrop-blur-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Center Navigation Links: Strictly Menu, About, Locations, My Orders, Ask Nawab AI */}
          <nav className="hidden md:flex items-center gap-6 text-[11px] font-['Oswald',sans-serif] font-semibold uppercase tracking-widest text-stone-700">
            <a href="#menu" className="hover:text-[#b8860b] transition-colors apple-press">
              Menu
            </a>
            <a href="#about" className="hover:text-[#b8860b] transition-colors apple-press">
              About
            </a>
            <a href="#locations" className="hover:text-[#b8860b] transition-colors apple-press">
              Locations
            </a>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="hover:text-[#b8860b] transition-colors flex items-center gap-1.5 text-stone-700 apple-press"
            >
              <History className="w-3.5 h-3.5 text-[#cba158]" />
              <span>My Orders</span>
            </button>
            <button
              onClick={() => setIsChatOpen(true)}
              className="hover:text-[#b8860b] transition-colors flex items-center gap-1.5 text-stone-700 font-semibold apple-press"
            >
              <Bot className="w-3.5 h-3.5 text-[#b8860b]" />
              <span>Ask Nawab AI</span>
            </button>
          </nav>

          {/* Right Section: Active Venue Badge, Ask AI button, Cart */}
          <div className="flex items-center gap-2">
            {/* Ask AI Pill Button */}
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#cba158]/15 via-amber-500/10 to-[#cba158]/20 hover:from-[#cba158]/25 hover:to-[#cba158]/35 border border-[#cba158]/40 text-[#8a5d11] hover:text-stone-900 text-xs font-semibold shadow-xs transition-all apple-press"
              title="Chat with Nawab AI for dish pairings & 5% off discounts"
            >
              <Bot className="w-3.5 h-3.5 text-[#b8860b] animate-bounce" />
              <span>Ask AI · 5% Off</span>
            </button>

            {/* Active Venue Switcher Chip */}
            {activeLocation && (
              <button
                type="button"
                onClick={() => setIsVenueSelectOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200/70 border border-stone-200 text-stone-800 text-[10px] font-mono transition-all apple-press"
                title="Click to switch venue branch"
              >
                <Compass className="w-3 h-3 text-[#b8860b]" />
                <span className="truncate max-w-[100px]">
                  {activeLocation.code === 'DHABA' ? 'Highway Dhaba' : 'Hazratganj'}
                </span>
                <span className="text-stone-400 text-[9px]">▾</span>
              </button>
            )}

            {/* Shopping Bag Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-stone-700 hover:text-stone-900 bg-stone-100/90 hover:bg-stone-200/80 rounded-xl border border-stone-200 transition-all apple-press"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#cba158] text-white font-mono font-bold text-[10px] rounded-full flex items-center justify-center shadow">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </header>
      </div>

      {/* HAMBURGER SIDE DRAWER (Left Slide with Apple-Style Fluid Spring Physics & Frosted Glass) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/35 backdrop-blur-md animate-apple-backdrop">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-2xl border-r border-stone-200/90 h-full p-6 flex flex-col justify-between shadow-[0_25px_60px_rgba(0,0,0,0.25)] z-10 overflow-y-auto animate-apple-drawer-left">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <span className="font-['Oswald',sans-serif] font-bold text-xl text-stone-900 tracking-wider uppercase">
                  SHANGRILLA
                </span>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-all apple-press"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active Venue Switcher Box */}
              <div className="p-4 rounded-xl bg-[#faf8f5] border border-stone-200 space-y-2.5 shadow-xs apple-card">
                <div className="text-[10px] uppercase font-mono tracking-wider text-stone-500">
                  Current Selected Venue
                </div>
                <div className="font-['Oswald',sans-serif] text-sm text-[#b8860b] font-bold uppercase truncate">
                  {activeLocation?.name || 'Shangrilla Dining'}
                </div>
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setIsVenueSelectOpen(true);
                  }}
                  className="w-full py-2 text-xs rounded-lg bg-white hover:bg-stone-50 text-stone-800 font-semibold border border-stone-200 shadow-sm transition-all flex items-center justify-center gap-1.5 spatial-interactive"
                >
                  <Compass className="w-3.5 h-3.5 text-[#b8860b]" />
                  <span>Switch Venue (Restaurant / Dhaba)</span>
                </button>
              </div>

              {/* Mobile Search Input */}
              <div className="sm:hidden relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search kebabs, biryani, curries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-[#faf8f5] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#cba158]"
                />
              </div>

              {/* Primary Drawer Navigation Links with Apple Cascade Staggering */}
              <div className="space-y-1 text-sm font-['Oswald',sans-serif] uppercase tracking-wider">
                <a
                  href="#menu"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-all apple-press apple-stagger-1"
                >
                  <span>Our Menu</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </a>

                <a
                  href="#about"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-all apple-press apple-stagger-2"
                >
                  <span>About Our Culinary Heritage</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </a>

                <a
                  href="#locations"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-all apple-press apple-stagger-3"
                >
                  <span>Locations & Live Map</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </a>

                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setIsHistoryOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-all text-left apple-press apple-stagger-4"
                >
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#cba158]" />
                    <span>My Past Orders</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setIsChatOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-[#faf8f5] border border-[#cba158]/35 text-stone-900 hover:bg-amber-100/50 transition-all text-left apple-press apple-stagger-5"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#b8860b]" />
                    <span className="font-bold">Ask Nawab AI Concierge</span>
                  </div>
                  <span className="text-[10px] bg-[#cba158] text-white font-mono px-2 py-0.5 rounded-full font-bold shadow-xs">
                    5% Off
                  </span>
                </button>
              </div>

              {/* Special Guest Actions */}
              <div className="pt-2 border-t border-stone-200 space-y-2">
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setIsBookEventOpen(true);
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#cba158] hover:bg-[#b8860b] text-white font-['Oswald',sans-serif] uppercase font-bold text-xs tracking-wider border border-[#cba158]/50 flex items-center justify-center gap-2 shadow-md transition-all apple-press"
                >
                  <PartyPopper className="w-3.5 h-3.5 text-white" />
                  <span>Book an Event / Banquet</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setIsBecomeMemberOpen(true);
                  }}
                  className="w-full py-2 px-3.5 rounded-xl bg-[#faf8f5] hover:bg-stone-100 text-stone-800 font-['Oswald',sans-serif] uppercase font-semibold text-xs tracking-wider border border-stone-200 flex items-center justify-center gap-2 transition-all apple-press"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#b8860b]" />
                  <span>Become a Member (+100 Pts)</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setIsLoyaltyOpen(true);
                  }}
                  className="w-full py-2 px-3.5 rounded-xl bg-[#faf8f5] hover:bg-stone-100 text-stone-800 font-['Oswald',sans-serif] uppercase font-semibold text-xs tracking-wider border border-stone-200 flex items-center justify-center gap-2 transition-all apple-press"
                >
                  <Crown className="w-3.5 h-3.5 text-[#b8860b]" />
                  <span>Royal Rewards Perks</span>
                </button>
              </div>
            </div>

            {/* Drawer Bottom: Password Protected Staff Login */}
            <div className="pt-6 border-t border-stone-200 space-y-3">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsStaffLoginOpen(true);
                }}
                className="w-full py-2 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 border border-stone-200 text-xs flex items-center justify-center gap-2 transition-colors font-mono"
              >
                <Lock className="w-3.5 h-3.5 text-[#b8860b]" />
                <span>Staff Portal Login</span>
              </button>

              <div className="text-[10px] text-stone-400 text-center font-mono">
                SHANGRILLA v2.4 · Lucknow, Uttar Pradesh
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FULL-BLEED HERO SECTION WITH CINEMATIC LUMINOUS OVERLAY */}
      <section className="relative w-full min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center text-center overflow-hidden bg-stone-900 pt-16">
        {/* Background Live Cooking Video Loop */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105 filter brightness-85"
          src="/assets/shangrilla-live-kitchen.mp4"
        />

        {/* Cinematic measured overlay for crystal text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f5] via-black/45 to-black/65 pointer-events-none" />

        {/* Hero Content with Spatial Layering */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-20 space-y-6">
          {/* Active Venue Banner */}
          {activeLocation && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-stone-200/90 text-xs text-stone-800 shadow-md spatial-interactive">
              <span className="w-2.5 h-2.5 rounded-full bg-[#cba158] animate-pulse" />
              <span>Dining at: <strong className="text-stone-900">{activeLocation.name}</strong></span>
              <button
                onClick={() => setIsVenueSelectOpen(true)}
                className="text-[#b8860b] hover:underline ml-1 font-mono text-[11px] font-semibold"
              >
                Change
              </button>
            </div>
          )}

          {/* Offer & Announcement Pill */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => {
                setAppliedCouponCode('ROYAL3K');
                setIsCartOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/90 to-[#b8860b]/90 text-white text-xs font-semibold shadow-lg hover:brightness-110 transition-all border border-amber-300/40"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Royal Feast: <strong>Flat 5% Off</strong> on orders ₹3,000+ (Use <strong>ROYAL3K</strong>)</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <h1 className="font-['Oswald',sans-serif] font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white uppercase tracking-tight leading-[1.05] drop-shadow-xl">
            Savour the Flavours<br />That Tell a Story
          </h1>

          <p className="font-['Oswald',sans-serif] text-sm sm:text-base md:text-lg text-stone-100 uppercase tracking-widest font-normal max-w-xl mx-auto leading-relaxed drop-shadow">
            Handcrafted dishes and signature drinks<br className="hidden sm:inline" /> made fresh, served with passion.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#menu"
              className="inline-block px-8 py-3.5 bg-white hover:bg-stone-50 text-stone-900 font-['Oswald',sans-serif] font-bold text-xs uppercase tracking-wider rounded-xl shadow-2xl transition-all spatial-interactive border border-stone-200 hover:border-[#cba158]"
            >
              Explore Our Menu
            </a>
            <button
              onClick={() => setIsChatOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-black/55 hover:bg-black/75 backdrop-blur-md text-amber-200 hover:text-white font-['Oswald',sans-serif] font-bold text-xs uppercase tracking-wider rounded-xl shadow-2xl transition-all spatial-interactive border border-[#cba158]/60 hover:border-[#cba158]"
            >
              <Bot className="w-4 h-4 text-[#cba158]" />
              <span>Ask AI Concierge</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. WARM IVORY/CREAM SECTION */}
      <section id="about" className="w-full bg-[#FAF7F2] text-[#1A1817] py-20 md:py-28 px-6 sm:px-8 lg:px-12 border-b border-stone-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
          <div className="md:col-span-3">
            <span className="font-['Oswald',sans-serif] text-xs font-semibold uppercase tracking-widest text-[#b8860b]">
              Welcome to Shangrilla
            </span>
          </div>

          <div className="md:col-span-9 space-y-6">
            <h2 className="font-['Oswald',sans-serif] font-bold text-3xl sm:text-4xl md:text-5xl text-[#1A1817] uppercase tracking-tight leading-[1.15]">
              Seasonal dishes crafted with passion and the freshest ingredients.
            </h2>

            <p className="font-['Oswald',sans-serif] text-xs sm:text-sm text-stone-600 uppercase tracking-wider leading-relaxed font-normal max-w-2xl">
              We bring vibrant flavors and warm hospitality together. From hearty classics to seasonal specials, every bite is crafted with passion and the freshest ingredients.
            </p>

            <div className="pt-2">
              <a
                href="#locations"
                className="inline-block px-6 py-2.5 bg-white border border-stone-300 hover:border-[#b8860b] text-stone-800 hover:text-[#b8860b] font-['Oswald',sans-serif] font-semibold text-xs uppercase tracking-wider rounded-xl transition-all spatial-interactive shadow-sm"
              >
                View Venues & Live GPS Map →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HORIZONTAL IMAGE GALLERY STRIP */}
      <section className="w-full bg-[#FAF7F2] pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {galleryStrip.map((item, idx) => (
              <div
                key={idx}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-200 shadow-sm border border-stone-200/80 group spatial-interactive"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PRISTINE WHITE MENU SECTION WITH RECOMMENDED FOR YOU */}
      <section id="menu" className="w-full bg-white text-stone-900 py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-t border-stone-200">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Section Header */}
          <div className="text-center space-y-2">
            <span className="font-['Oswald',sans-serif] text-[11px] uppercase tracking-widest text-[#b8860b] font-semibold">
              Our Dishes
            </span>
            <h2 className="font-['Oswald',sans-serif] font-bold text-3xl sm:text-4xl md:text-5xl text-stone-900 uppercase tracking-tight">
              Dishes That Keep Guests Coming Back.
            </h2>
          </div>

          {/* 5.1. RECOMMENDED FOR YOU SECTION (Personalized via Loyalty & Past Order History) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#faf8f5] border border-[#cba158]/40 shadow-xl space-y-6 spatial-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#cba158]/15 border border-[#cba158]/30 flex items-center justify-center text-[#b8860b]">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#b8860b] font-semibold">
                    {pastOrders.length > 0 ? 'Curated For Your Palate' : 'Royal Chef Selections'}
                  </span>
                </div>
                <h3 className="font-['Oswald',sans-serif] font-bold text-2xl text-stone-900 uppercase tracking-tight">
                  Recommended for You
                </h3>
                <p className="text-xs text-stone-600 font-light">
                  {pastOrders.length > 0
                    ? `Based on your previous orders as a royal member (${customerName || customerPhone}).`
                    : 'Personalized signature dishes favored by food connoisseurs in Lucknow.'}
                </p>
              </div>

              {!customerPhone && (
                <button
                  onClick={() => setIsBecomeMemberOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm spatial-interactive self-start sm:self-auto"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#b8860b]" />
                  <span>Join Royal Club to Personalize</span>
                </button>
              )}
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedDishes.map((dish) => (
                <div
                  key={`rec-${dish.id}`}
                  onClick={() => setSelectedDish(dish)}
                  className="group relative bg-white border border-stone-200 hover:border-[#cba158] rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-sm hover:shadow-2xl spatial-card"
                >
                  <div className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden">
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-mono text-[#b8860b] font-bold border border-stone-200 shadow-sm">
                        {pastOrders.length > 0 ? 'Past Favorite' : 'Must Try'}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white drop-shadow-md">
                      <span className="font-mono font-bold text-sm tabular-nums">
                        ₹{dish.discountedPrice ?? dish.price}
                      </span>
                      <span className="text-[10px] uppercase font-mono text-stone-200">
                        {dish.portionSize}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-['Oswald',sans-serif] font-bold text-sm text-stone-900 uppercase group-hover:text-[#b8860b] transition-colors leading-snug">
                        {dish.name}
                      </h4>
                      {dish.hindiName && (
                        <span className="text-[10px] text-[#b8860b] block mt-0.5 font-serif font-medium">
                          {dish.hindiName}
                        </span>
                      )}
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 font-light leading-relaxed">
                        {dish.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDish(dish);
                      }}
                      className="w-full py-2.5 bg-[#cba158] hover:bg-[#b8860b] text-white font-['Oswald',sans-serif] uppercase font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md spatial-interactive"
                    >
                      <span>Add to Order</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Royal Offers & Featured Specials Highlight Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#cba158]/15 to-amber-600/10 border border-[#cba158]/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 spatial-card">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#cba158] text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Royal Offer · 5% Off
                </span>
                <span className="text-[10px] font-mono text-stone-500">Code: <strong className="text-stone-900 font-bold">ROYAL3K</strong></span>
              </div>
              <h3 className="font-['Oswald',sans-serif] font-bold text-xl sm:text-2xl text-stone-900 uppercase tracking-tight">
                5% Off Orders of ₹3,000 & Above
              </h3>
              <p className="text-xs text-stone-600 max-w-xl font-light">
                Indulge in our slow-cooked royal delicacies. Apply coupon <span className="font-mono font-bold text-[#b8860b]">ROYAL3K</span> in your bag for an instant 5% off up to ₹1,000. Ask our Nawab AI concierge for signature recommendations!
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAppliedCouponCode('ROYAL3K');
                  setIsCartOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#cba158] hover:bg-[#b8860b] text-white text-xs font-['Oswald',sans-serif] uppercase font-bold tracking-wider shadow-md hover:shadow-lg transition-all spatial-interactive flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Apply ROYAL3K</span>
              </button>
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-xs font-['Oswald',sans-serif] uppercase font-bold tracking-wider shadow-sm transition-all spatial-interactive flex items-center gap-1.5"
              >
                <Bot className="w-3.5 h-3.5 text-[#b8860b]" />
                <span>Ask Nawab AI</span>
              </button>
            </div>
          </div>

          {/* 5.2. Filter Bar: Categories + Veg Toggle */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm font-['Oswald',sans-serif] uppercase tracking-wider text-stone-700 font-semibold">
                Explore Full Royal Menu ({filteredDishes.length} Dishes)
              </div>

              <button
                type="button"
                onClick={() => setVegOnly(!vegOnly)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all spatial-interactive ${
                  vegOnly
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                    : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200/60'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                  vegOnly ? 'border-emerald-500 bg-emerald-600' : 'border-stone-400 bg-white'
                }`}>
                  {vegOnly && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
                <span>Pure Vegetarian</span>
              </button>
            </div>

            {/* Segmented Category Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-['Oswald',sans-serif] uppercase tracking-wider whitespace-nowrap transition-all spatial-interactive ${
                    activeCategory === cat
                      ? 'bg-[#cba158] text-white font-bold shadow-md'
                      : 'bg-stone-100 text-stone-700 hover:text-stone-900 hover:bg-stone-200/70 border border-stone-200'
                  }`}
                >
                  {cat === 'Featured' ? '⭐ Featured Dishes' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* 5.3. Dishes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                onClick={() => setSelectedDish(dish)}
                className="group relative bg-white border border-stone-200 hover:border-[#cba158] rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-sm hover:shadow-2xl spatial-card"
              >
                <div className="relative aspect-[4/5] w-full bg-stone-100 overflow-hidden">
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';
                    }}
                  />

                  <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/75 via-black/35 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />

                  {/* Featured Badge */}
                  {dish.isFeatured && (
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-[#cba158] text-white text-[9px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        Featured
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 inset-x-3 pr-16">
                    <span className="font-['Oswald',sans-serif] font-bold text-xs sm:text-sm text-white uppercase tracking-wider block leading-tight drop-shadow-md">
                      {dish.name}
                    </span>
                    {dish.hindiName && (
                      <span className="text-[10px] text-[#edd89f] font-serif block mt-0.5">
                        {dish.hindiName}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-white tabular-nums drop-shadow-md">
                      ₹{dish.discountedPrice ?? dish.price}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDish(dish);
                      }}
                      className="w-8 h-8 bg-[#cba158] hover:bg-[#b8860b] text-white rounded-xl flex items-center justify-center transition-all shadow-md hover:scale-110 active:scale-95"
                      title="Add to cart / Customize"
                      aria-label={`Add ${dish.name} to cart`}
                    >
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. LOCATIONS SECTION WITH LIVE INTERACTIVE MAP SYNCED TO USER VENUE */}
      <section id="locations" className="w-full bg-[#FAF7F2] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-stone-200">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="font-['Oswald',sans-serif] text-xs uppercase tracking-widest text-[#b8860b] font-semibold">
              Lucknow, Uttar Pradesh
            </span>
            <h3 className="font-['Oswald',sans-serif] font-bold text-2xl sm:text-4xl text-stone-900 uppercase tracking-tight">
              Our Venues & Live GPS Map
            </h3>
            <p className="text-xs text-stone-600 max-w-xl mx-auto font-light">
              Explore our Hazratganj Royal Fine Dining Hall and our 24/7 Highway Express Dhaba on NH-27.
            </p>
          </div>

          {/* Interactive Live Map Component synced to selected venue */}
          <LocationMap
            locations={locations}
            activeLocationId={activeLocation?.id}
            onSelectLocation={handleVenueSelected}
          />
        </div>
      </section>

      {/* 7. BANQUET EVENTS & ROYAL REWARDS SHOWCASE */}
      <section className="w-full py-16 px-4 bg-white border-t border-stone-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Banquets & Event Celebrations */}
          <div className="relative p-8 rounded-2xl bg-gradient-to-br from-[#faf8f5] via-white to-[#f5f2eb] border border-[#cba158]/35 overflow-hidden flex flex-col justify-between space-y-6 shadow-md spatial-card">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#cba158]/15 border border-[#cba158]/30 flex items-center justify-center text-[#b8860b]">
                  <PartyPopper className="w-4 h-4" />
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#b8860b]">
                  IMPERIAL BANQUETS & LAWNS
                </span>
              </div>
              <h3 className="font-['Oswald',sans-serif] font-bold text-2xl sm:text-3xl text-stone-900 uppercase tracking-tight">
                Celebrate Royal Weddings & Grand Parties
              </h3>
              <p className="text-xs text-stone-600 font-light leading-relaxed">
                Whether it's an intimate Awadhi dastarkhwan feast at our Hazratganj Royal Darbar Hall (150 Pax) or an open-air 500-guest celebration across our Highway Dhaba Grand Lawns, we orchestrate unforgettable culinary occasions.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => setIsBookEventOpen(true)}
                className="px-6 py-3 rounded-xl bg-[#cba158] hover:bg-[#b8860b] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md spatial-interactive"
              >
                <span>Request Banquet / Event Booking</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 2: Royal Rewards Club */}
          <div className="relative p-8 rounded-2xl bg-gradient-to-br from-[#faf8f5] via-white to-[#f5f2eb] border border-[#cba158]/35 overflow-hidden flex flex-col justify-between space-y-6 shadow-md spatial-card">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#cba158]/15 border border-[#cba158]/30 flex items-center justify-center text-[#b8860b]">
                  <Crown className="w-4 h-4" />
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#b8860b]">
                  SHANGRILLA ROYAL CLUB
                </span>
              </div>
              <h3 className="font-['Oswald',sans-serif] font-bold text-2xl sm:text-3xl text-stone-900 uppercase tracking-tight">
                Earn 5% Back with Royal Rewards
              </h3>
              <p className="text-xs text-stone-600 font-light leading-relaxed">
                Every dining experience awards you points linked seamlessly with your mobile number. Redeem points for instant discounts on online orders and dine-in bills, and ascend through Bronze, Silver, Gold, and Shahi VIP tiers.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => setIsBecomeMemberOpen(true)}
                className="px-6 py-3 rounded-xl bg-[#cba158] hover:bg-[#b8860b] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md spatial-interactive"
              >
                <span>Become a Member (+100 Pts)</span>
                <span>→</span>
              </button>

              <button
                onClick={() => setIsLoyaltyOpen(true)}
                className="px-5 py-3 rounded-xl bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs uppercase tracking-wider border border-stone-200 transition-all shadow-sm spatial-interactive"
              >
                View Points Balance
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. LUXURY WHITE FOOTER WITH DISCREET STAFF LOGIN */}
      <footer className="w-full bg-[#f5f2eb] border-t border-stone-200 py-12 px-4 text-center text-xs text-stone-600">
        <div className="max-w-4xl mx-auto space-y-5">
          <span className="font-['Oswald',sans-serif] font-bold text-2xl text-stone-900 uppercase tracking-widest block">
            SHANGRILLA
          </span>
          <div className="flex justify-center gap-6 text-stone-600 text-xs flex-wrap">
            <a href="#menu" className="hover:text-stone-900 transition-colors">Menu</a>
            <a href="#about" className="hover:text-stone-900 transition-colors">About</a>
            <a href="#locations" className="hover:text-stone-900 transition-colors">Locations</a>
            <button onClick={() => setIsBookEventOpen(true)} className="hover:text-stone-900 transition-colors">Book an Event</button>
            <button onClick={() => setIsBecomeMemberOpen(true)} className="hover:text-[#b8860b] text-[#b8860b] font-medium transition-colors">Become a Member</button>
            <button onClick={() => setIsLoyaltyOpen(true)} className="hover:text-stone-900 transition-colors">Royal Rewards</button>
            <button onClick={() => setIsHistoryOpen(true)} className="hover:text-stone-900 transition-colors">Order History</button>
            {/* Password protected staff login modal trigger */}
            <button
              onClick={() => setIsStaffLoginOpen(true)}
              className="text-[#b8860b] hover:underline flex items-center gap-1 font-mono font-medium transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>Staff Login</span>
            </button>
          </div>
          <p className="text-[11px] text-stone-500 font-light">
            © {new Date().getFullYear()} SHANGRILLA Restaurant & Dhaba. All rights reserved. Lucknow, Uttar Pradesh.
          </p>
        </div>
      </footer>

      {/* --- ALL MODALS & DRAWERS --- */}

      {/* Initial Venue Selection Modal */}
      <VenueSelectModal
        isOpen={isVenueSelectOpen}
        onClose={() => setIsVenueSelectOpen(false)}
        locations={locations}
        activeLocationId={activeLocation?.id}
        onSelectLocation={handleVenueSelected}
        isInitialPrompt={isInitialVenuePrompt}
      />

      {/* Password Protected Staff Login Modal */}
      <StaffLoginModal
        isOpen={isStaffLoginOpen}
        onClose={() => setIsStaffLoginOpen(false)}
        onLoginSuccess={(role) => {
          setCurrentView(role);
        }}
      />

      {/* Become a Member Modal */}
      <BecomeMemberModal
        isOpen={isBecomeMemberOpen}
        onClose={() => setIsBecomeMemberOpen(false)}
        locations={locations}
        onMemberRegistered={(phone, name) => {
          setCustomerPhone(phone);
          setCustomerName(name);
        }}
      />

      {/* Dish Detail Modal */}
      {selectedDish && (
        <DishDetailModal
          item={selectedDish}
          onClose={() => setSelectedDish(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Cart Drawer */}
      {activeLocation && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={() => setCart([])}
          location={activeLocation}
          initialTable={tableParam || undefined}
          initialCouponCode={appliedCouponCode}
          onOrderSuccess={(placedOrder) => {
            setCart([]);
            setActiveBillOrder(placedOrder);
          }}
        />
      )}

      {/* Digital Bill Modal */}
      {activeBillOrder && (
        <DigitalBillModal
          order={activeBillOrder}
          onClose={() => setActiveBillOrder(null)}
          onTrackOrder={(orderId) => {
            setActiveBillOrder(null);
            setTrackingOrderId(orderId);
          }}
          onOpenFeedback={(order) => {
            setActiveBillOrder(null);
            setFeedbackOrder(order);
          }}
        />
      )}

      {/* Order Tracker Modal */}
      {trackingOrderId && (
        <OrderTrackerModal
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
          onViewBill={(order) => {
            setTrackingOrderId(null);
            setActiveBillOrder(order);
          }}
          onOpenFeedback={(order) => {
            setTrackingOrderId(null);
            setFeedbackOrder(order);
          }}
        />
      )}

      {/* Customer Feedback Modal */}
      {feedbackOrder && (
        <CustomerFeedbackModal
          order={feedbackOrder}
          onClose={() => setFeedbackOrder(null)}
          onFeedbackSubmitted={() => setFeedbackOrder(null)}
        />
      )}

      {/* Order History Modal */}
      {isHistoryOpen && (
        <OrderHistoryModal
          menuItems={menuItems}
          onClose={() => setIsHistoryOpen(false)}
          onViewBill={(order) => {
            setIsHistoryOpen(false);
            setActiveBillOrder(order);
          }}
          onTrackOrder={(orderId) => {
            setIsHistoryOpen(false);
            setTrackingOrderId(orderId);
          }}
          onOpenFeedback={(order) => {
            setIsHistoryOpen(false);
            setFeedbackOrder(order);
          }}
          onRepeatOrder={(items) => {
            for (const { item, quantity } of items) {
              handleAddToCart(item, quantity, []);
            }
          }}
        />
      )}

      {/* Book an Event Modal */}
      {isBookEventOpen && (
        <BookEventModal
          isOpen={isBookEventOpen}
          onClose={() => setIsBookEventOpen(false)}
          defaultLocationId={activeLocation?.id}
        />
      )}

      {/* Royal Rewards Loyalty Modal */}
      {isLoyaltyOpen && (
        <LoyaltyModal
          isOpen={isLoyaltyOpen}
          onClose={() => setIsLoyaltyOpen(false)}
          onSelectRedeem={() => {
            setIsCartOpen(true);
          }}
        />
      )}

      {/* Nawab AI Concierge Chatbot */}
      <GeminiChatBot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onOpen={() => setIsChatOpen(true)}
        activeLocation={activeLocation}
        menuItems={menuItems}
        onAddToCart={(dish) => {
          handleAddToCart(dish, 1, []);
          setIsCartOpen(true);
        }}
        onApplyCoupon={(code) => {
          setAppliedCouponCode(code);
          setIsCartOpen(true);
        }}
      />
    </div>
  );
}

export default App;
