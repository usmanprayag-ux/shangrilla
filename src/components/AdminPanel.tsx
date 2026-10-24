import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  BookOpen,
  Truck,
  QrCode,
  TrendingUp,
  Award,
  Globe,
  ShieldAlert,
  Database,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Save,
  Download,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  Check,
  Video,
  Star,
  MessageSquare,
  PartyPopper,
  Crown,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  Phone,
  Building,
  Coins,
  X,
  Search
} from 'lucide-react';
import {
  Location,
  MenuItem,
  Order,
  Ingredient,
  Recipe,
  Supplier,
  PurchaseOrder,
  WebsiteConfig,
  AuditLog,
  Coupon,
  EventBooking,
  EventStatus,
  EventType,
  LoyaltyAccount,
  LoyaltySettings
} from '../types/models';
import { api } from '../services/api';
import { TableQRCodeModal } from './TableQRCodeModal';
import { DigitalBillModal } from './DigitalBillModal';
import { BookEventModal } from './BookEventModal';

interface AdminPanelProps {
  locations: Location[];
  onExit: () => void;
  onOpenTableOrdering?: (url: string) => void;
}

type AdminTab =
  | 'overview'
  | 'orders'
  | 'banquets'
  | 'loyalty'
  | 'menu'
  | 'inventory'
  | 'recipes'
  | 'suppliers'
  | 'tables'
  | 'analytics'
  | 'coupons'
  | 'feedback'
  | 'website'
  | 'audit'
  | 'backup';

export const AdminPanel: React.FC<AdminPanelProps> = ({ locations, onExit, onOpenTableOrdering }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [eventBookings, setEventBookings] = useState<EventBooking[]>([]);
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<any[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Banquet & Event UI states
  const [showBookEventModal, setShowBookEventModal] = useState<boolean>(false);
  const [eventSearch, setEventSearch] = useState<string>('');
  const [eventStatusFilter, setEventStatusFilter] = useState<string>('all');
  const [editingEvent, setEditingEvent] = useState<EventBooking | null>(null);

  // Loyalty UI states
  const [loyaltySearch, setLoyaltySearch] = useState<string>('');
  const [loyaltyTierFilter, setLoyaltyTierFilter] = useState<string>('all');
  const [showAdjustPointsModal, setShowAdjustPointsModal] = useState<boolean>(false);
  const [selectedAccountForAdjust, setSelectedAccountForAdjust] = useState<any | null>(null);
  const [adjustPointsValue, setAdjustPointsValue] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState<string>('Special VIP Customer Reward');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [loyaltySettingsDirty, setLoyaltySettingsDirty] = useState<boolean>(false);

  // Modals
  const [qrModalTable, setQrModalTable] = useState<{ location: Location; tableNumber: string } | null>(null);
  const [viewBillOrder, setViewBillOrder] = useState<Order | null>(null);

  // Forms
  const [showAddDishModal, setShowAddDishModal] = useState<boolean>(false);
  const [newDish, setNewDish] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    category: 'Awadhi Specials',
    price: 250,
    isVeg: true,
    isAvailable: true,
    portionSize: '1 Portion',
    spiceLevel: 'Medium',
    preparationTimeMinutes: 15,
    locationId: 'all'
  });

  // Website Config Edit Form
  const [heroTitle, setHeroTitle] = useState<string>('');
  const [heroSubtitle, setHeroSubtitle] = useState<string>('');
  const [announcementBanner, setAnnouncementBanner] = useState<string>('');
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [homepageVideoUrl, setHomepageVideoUrl] = useState<string>('/assets/shangrilla-live-kitchen.mp4');
  const [savedSuccess, setSavedSuccess] = useState<string>('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        ordersData,
        menuData,
        invData,
        forecastData,
        recipesData,
        suppliersData,
        posData,
        analyticsData,
        couponsData,
        feedbackData,
        eventsData,
        loyaltyAccsData,
        loyaltySettingsData,
        webConfigData,
        logsData
      ] = await Promise.all([
        api.getOrders({ locationId: selectedLocationId }),
        api.getMenu(selectedLocationId),
        api.getInventory(),
        api.getStockForecast(),
        api.getRecipes(),
        api.getSuppliers(),
        api.getPurchaseOrders(),
        api.getAnalytics(selectedLocationId),
        fetch('/api/coupons').then(r => r.json()).then(j => j.data || []),
        api.getFeedback({ locationId: selectedLocationId }),
        api.getEvents({ locationId: selectedLocationId }),
        api.getLoyaltyAccounts(),
        api.getLoyaltySettings(),
        api.getWebsiteConfig(),
        api.getAuditLogs()
      ]);

      setOrders(ordersData);
      setMenuItems(menuData);
      setIngredients(invData.ingredients || []);
      setForecast(forecastData || []);
      setRecipes(recipesData || []);
      setSuppliers(suppliersData || []);
      setPurchaseOrders(posData || []);
      setAnalytics(analyticsData);
      setCoupons(couponsData || []);
      setFeedbacks(feedbackData || []);
      setEventBookings(eventsData || []);
      setLoyaltyAccounts(loyaltyAccsData || []);
      setLoyaltySettings(loyaltySettingsData || null);
      setWebsiteConfig(webConfigData);
      setAuditLogs(logsData || []);

      if (webConfigData) {
        setHeroTitle(webConfigData.heroTitle);
        setHeroSubtitle(webConfigData.heroSubtitle);
        setAnnouncementBanner(webConfigData.announcementBanner);
        setShowBanner(webConfigData.showBanner);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedLocationId]);

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveMenuItem(newDish);
      setShowAddDishModal(false);
      setNewDish({
        name: '',
        description: '',
        category: 'Awadhi Specials',
        price: 250,
        isVeg: true,
        isAvailable: true,
        portionSize: '1 Portion',
        spiceLevel: 'Medium',
        preparationTimeMinutes: 15,
        locationId: 'all'
      });
      const updatedMenu = await api.getMenu(selectedLocationId);
      setMenuItems(updatedMenu);
    } catch (err: any) {
      alert(err.message || 'Error saving dish');
    }
  };

  const handleDeleteDish = async (id: string) => {
    if (!confirm('Are you sure you want to remove this dish from the menu?')) return;
    try {
      await api.deleteMenuItem(id);
      setMenuItems(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete dish');
    }
  };

  const handleToggleDishAvailability = async (item: MenuItem) => {
    try {
      const updated = await api.saveMenuItem({ ...item, isAvailable: !item.isAvailable });
      setMenuItems(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    } catch (err: any) {
      alert(err.message || 'Toggle failed');
    }
  };

  const handleSaveWebsiteConfig = async () => {
    try {
      const updated = await api.updateWebsiteConfig({
        heroTitle,
        heroSubtitle,
        announcementBanner,
        showBanner
      });
      setWebsiteConfig(updated);
      setSavedSuccess('Website configuration updated and published successfully!');
      setTimeout(() => setSavedSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save configuration');
    }
  };

  const handleUpdateEventStatus = async (eventId: string, newStatus: EventStatus) => {
    try {
      const updated = await api.updateEvent(eventId, { status: newStatus, operator: 'Admin Console' });
      setEventBookings(prev => prev.map(e => (e.id === updated.id ? updated : e)));
    } catch (err: any) {
      alert(err.message || 'Failed to update event status');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to cancel and remove this banquet booking?')) return;
    try {
      await api.deleteEvent(eventId, 'Admin Console');
      setEventBookings(prev => prev.filter(e => e.id !== eventId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };

  const handleSaveLoyaltySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loyaltySettings) return;
    try {
      const updated = await api.updateLoyaltySettings({
        ...loyaltySettings,
        operator: 'Admin Console'
      });
      setLoyaltySettings(updated);
      setLoyaltySettingsDirty(false);
      alert('Loyalty program settings updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update loyalty settings');
    }
  };

  const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountForAdjust) return;
    setIsAdjusting(true);
    try {
      await api.adjustLoyaltyPoints({
        phone: selectedAccountForAdjust.phone,
        pointsDelta: adjustPointsValue,
        reason: adjustReason.trim() || 'Manual adjustment by Admin',
        operator: 'Admin Console'
      });
      setShowAdjustPointsModal(false);
      // Reload loyalty accounts
      const accs = await api.getLoyaltyAccounts();
      setLoyaltyAccounts(accs);
    } catch (err: any) {
      alert(err.message || 'Failed to adjust points');
    } finally {
      setIsAdjusting(false);
    }
  };

  const exportSalesCsv = () => {
    if (!orders || orders.length === 0) return;
    const headers = ['Order Number', 'Date', 'Location', 'Type', 'Table', 'Customer', 'Items', 'Total', 'Payment', 'Kitchen'];
    const rows = orders.map(o => [
      o.displayNumber,
      new Date(o.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      o.locationName,
      o.orderType,
      o.tableNumber || '-',
      o.customerName,
      `"${o.items.map(i => `${i.quantity}x ${i.name}`).join('; ')}"`,
      o.total,
      o.paymentStatus,
      o.kitchenStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shangrilla-sales-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReceivePO = async (poId: string) => {
    const inv = prompt('Enter Supplier Invoice Reference Number:', `INV-${Date.now().toString().slice(-5)}`);
    if (!inv) return;
    try {
      const updated = await api.receivePurchaseOrder(poId, inv);
      setPurchaseOrders(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      const invData = await api.getInventory();
      setIngredients(invData.ingredients || []);
      alert('Stock received and inventory balances automatically incremented!');
    } catch (err: any) {
      alert(err.message || 'Failed to receive PO');
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0a0c] text-stone-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#160f12] border-r border-[#cba158]/30 flex flex-col shrink-0">
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#cba158]">
              MASTER CONSOLE
            </span>
            <h2 className="text-lg font-serif font-bold text-white tracking-wide">
              SHANGRILLA
            </h2>
          </div>
          <button
            onClick={onExit}
            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs transition-colors"
          >
            Exit
          </button>
        </div>

        {/* Location Selector */}
        <div className="p-3 border-b border-stone-800/80 bg-black/20">
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-stone-400 mb-1">
            Active Location Scope
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#cba158]"
          >
            <option value="all">Consolidated (Both Locations)</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
          {[
            { id: 'overview', label: 'Overview & KPIs', icon: LayoutDashboard },
            { id: 'orders', label: 'Live Orders Queue', icon: Receipt },
            { id: 'banquets', label: 'Banquets & Event Bookings', icon: PartyPopper },
            { id: 'loyalty', label: 'Royal Loyalty Program', icon: Crown },
            { id: 'menu', label: 'Menu & Dishes', icon: UtensilsCrossed },
            { id: 'inventory', label: 'Inventory & Stock Forecast', icon: Package },
            { id: 'recipes', label: 'Recipes & Food Costing', icon: BookOpen },
            { id: 'suppliers', label: 'Suppliers & Purchase Orders', icon: Truck },
            { id: 'tables', label: 'Tables & QR Codes', icon: QrCode },
            { id: 'analytics', label: 'Sales & Profit Analytics', icon: TrendingUp },
            { id: 'coupons', label: 'Coupons & Discounts', icon: Award },
            { id: 'feedback', label: 'Customer Reviews & Feedback', icon: Star },
            { id: 'website', label: 'Website & Video Editor', icon: Globe },
            { id: 'audit', label: 'Audit Trail Logs', icon: ShieldAlert },
            { id: 'backup', label: 'Backup & Recovery', icon: Database }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-[#cba158] text-[#140e11] font-bold shadow-md'
                    : 'text-stone-400 hover:text-white hover:bg-stone-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-stone-800 text-[11px] text-stone-500 text-center">
          Lucknow, UP · Asia/Kolkata
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0e0a0c]">
        {/* Top bar */}
        <header className="px-6 py-4 bg-[#140e11] border-b border-stone-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif font-bold text-white uppercase tracking-wide">
              {activeTab.replace('_', ' ')}
            </h1>
            <p className="text-xs text-stone-400">
              Authoritative Backend Engine · 48-Hour Short Order Cycle
            </p>
          </div>
          <button
            onClick={loadAllData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#1a1215] border border-stone-800 shadow-lg">
                  <span className="text-[11px] uppercase font-bold text-stone-400">Gross Sales</span>
                  <p className="text-3xl font-mono font-bold text-white mt-1 tabular-nums">
                    ₹{analytics?.grossSales?.toFixed(2) || '0.00'}
                  </p>
                  <span className="text-xs text-emerald-400 mt-1 block">
                    {analytics?.orderCount || 0} Total Orders
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#1a1215] border border-stone-800 shadow-lg">
                  <span className="text-[11px] uppercase font-bold text-stone-400">Net Sales</span>
                  <p className="text-3xl font-mono font-bold text-[#f8ecd4] mt-1 tabular-nums">
                    ₹{analytics?.netSales?.toFixed(2) || '0.00'}
                  </p>
                  <span className="text-xs text-stone-400 mt-1 block">
                    After ₹{analytics?.totalDiscounts?.toFixed(2) || '0'} Discounts
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#1a1215] border border-stone-800 shadow-lg">
                  <span className="text-[11px] uppercase font-bold text-stone-400">Tax Collected (GST)</span>
                  <p className="text-3xl font-mono font-bold text-white mt-1 tabular-nums">
                    ₹{analytics?.totalTaxCollected?.toFixed(2) || '0.00'}
                  </p>
                  <span className="text-xs text-stone-400 mt-1 block">
                    2.5% CGST + 2.5% SGST
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#1a1215] border border-stone-800 shadow-lg">
                  <span className="text-[11px] uppercase font-bold text-stone-400">Est. Net Profit</span>
                  <p className="text-3xl font-mono font-bold text-emerald-400 mt-1 tabular-nums">
                    ₹{analytics?.estimatedNetOperatingProfit?.toFixed(2) || '0.00'}
                  </p>
                  <span className="text-xs text-stone-400 mt-1 block">
                    After Food Cost & Operating Expenses
                  </span>
                </div>
              </div>

              {/* Stock Alerts & Top Dishes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stock Alert Warning Box */}
                <div className="p-5 rounded-2xl bg-[#1a1215] border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Critical Stock & Reorder Suggestions
                    </h3>
                    <span className="text-xs font-mono text-stone-400">
                      {forecast.filter(f => f.isLowStock).length} Low Stock
                    </span>
                  </div>

                  <div className="divide-y divide-stone-800">
                    {forecast.filter(f => f.isLowStock).slice(0, 4).map((f, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-white block">{f.name}</span>
                          <span className="text-[10px] text-stone-400">
                            Current: <strong className="text-amber-400">{f.currentStock} {f.unit}</strong> (Reorder at {f.reorderLevel})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-red-400 font-bold block">
                            ~{f.daysRemaining} Days Left
                          </span>
                          <span className="text-[10px] text-stone-400">
                            Suggest PO: {f.suggestedPurchaseQty} {f.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                    {forecast.filter(f => f.isLowStock).length === 0 && (
                      <p className="py-4 text-xs text-emerald-400">All ingredient stocks are in safe buffer levels.</p>
                    )}
                  </div>
                </div>

                {/* Top Selling Dishes */}
                <div className="p-5 rounded-2xl bg-[#1a1215] border border-stone-800 space-y-3">
                  <h3 className="font-serif font-bold text-base text-white">
                    Top Selling Awadhi & Dhaba Dishes
                  </h3>
                  <div className="divide-y divide-stone-800">
                    {analytics?.topDishes?.map((d: any, idx: number) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded bg-[#cba158]/20 text-[#f8ecd4] font-mono font-bold flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-white">{d.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-white block">₹{d.revenue}</span>
                          <span className="text-[10px] text-stone-400">{d.count} orders</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-lg text-white">Live Orders Management</h3>
                <button
                  onClick={exportSalesCsv}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#cba158]" />
                  Export Orders CSV
                </button>
              </div>

              <div className="bg-[#181114] border border-stone-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-black/40 text-[11px] uppercase tracking-wider text-stone-400 border-b border-stone-800">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Kitchen</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4 text-right">Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-sans">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-stone-900/40">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-white px-2 py-0.5 bg-[#cba158]/20 border border-[#cba158]/40 rounded">
                            {order.displayNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {order.orderType === 'DINE_IN' ? order.tableNumber || 'Dine-In' : order.orderType}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white block font-medium">{order.customerName}</span>
                          <span className="text-[10px] text-stone-500 font-mono">{order.customerPhone}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate">
                          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white tabular-nums">
                          ₹{order.total.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-900 text-stone-300 border border-stone-700">
                            {order.kitchenStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            order.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setViewBillOrder(order)}
                            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded"
                            title="View Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: BANQUETS & EVENT BOOKINGS */}
          {activeTab === 'banquets' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#cba158]">
                      EVENT CONCIERGE & CATERING
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#cba158]/10 text-[#e5c179] border border-[#cba158]/30">
                      DUAL VENUE
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-white">
                    Banquet, Party & Event Bookings
                  </h3>
                  <p className="text-xs text-stone-400">
                    Capture event type, headcount, dates, and venue branches for royal weddings, corporate galas & lawn parties.
                  </p>
                </div>

                <button
                  onClick={() => setShowBookEventModal(true)}
                  className="px-4 py-2.5 bg-[#cba158] hover:bg-[#dfb872] text-[#140e11] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#cba158]/20 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Book an Event / New Request
                </button>
              </div>

              {/* Metrics Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[#181114] border border-stone-800">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Total Inquiries</span>
                  <div className="text-2xl font-bold font-mono text-white mt-0.5">
                    {eventBookings.length}
                  </div>
                  <span className="text-[10px] text-stone-500">All venues</span>
                </div>

                <div className="p-4 rounded-xl bg-[#181114] border border-stone-800">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Confirmed Events</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                    {eventBookings.filter(e => e.status === 'CONFIRMED').length}
                  </div>
                  <span className="text-[10px] text-stone-500">
                    {eventBookings.filter(e => e.status === 'PENDING').length} pending review
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#181114] border border-stone-800">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Total Guests Planned</span>
                  <div className="text-2xl font-bold font-mono text-[#e5c179] mt-0.5">
                    {eventBookings.reduce((sum, e) => sum + (e.headcount || 0), 0)} <span className="text-xs font-sans text-stone-400">Pax</span>
                  </div>
                  <span className="text-[10px] text-stone-500">Across upcoming dates</span>
                </div>

                <div className="p-4 rounded-xl bg-[#181114] border border-stone-800">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Advances Received</span>
                  <div className="text-2xl font-bold font-mono text-white mt-0.5">
                    ₹{eventBookings.reduce((sum, e) => sum + (e.advanceDepositPaid || 0), 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-stone-500">
                    Est. Total: ₹{eventBookings.reduce((sum, e) => sum + (e.totalEstimatedAmount || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="p-3.5 rounded-xl bg-[#181114] border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-500" />
                  <input
                    type="text"
                    placeholder="Search by ref, guest, phone or event..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#cba158]"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={eventStatusFilter}
                    onChange={(e) => setEventStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#cba158]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="PENDING">Pending (Action Required)</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>

                  <button
                    onClick={() => {
                      setEventSearch('');
                      setEventStatusFilter('all');
                    }}
                    className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs"
                    title="Reset filters"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Bookings List */}
              <div className="space-y-3">
                {eventBookings
                  .filter(e => {
                    const matchLoc = selectedLocationId === 'all' || e.preferredLocationId === selectedLocationId;
                    const matchStatus = eventStatusFilter === 'all' || e.status === eventStatusFilter;
                    const matchSearch = !eventSearch || (
                      e.bookingReference.toLowerCase().includes(eventSearch.toLowerCase()) ||
                      e.customerName.toLowerCase().includes(eventSearch.toLowerCase()) ||
                      e.customerPhone.includes(eventSearch) ||
                      e.eventType.toLowerCase().includes(eventSearch.toLowerCase())
                    );
                    return matchLoc && matchStatus && matchSearch;
                  })
                  .map((evt) => {
                    const isConfirmed = evt.status === 'CONFIRMED';
                    const isPending = evt.status === 'PENDING';
                    const isHazratganj = evt.preferredLocationId === 'shangrilla-hazratganj';

                    return (
                      <div
                        key={evt.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          isPending
                            ? 'bg-[#1e1518] border-amber-500/40 ring-1 ring-amber-500/20'
                            : isConfirmed
                            ? 'bg-[#181214] border-emerald-500/30'
                            : 'bg-[#181114] border-stone-800'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-stone-800">
                          {/* Left: Ref, Date, Type */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-[#e5c179] bg-[#cba158]/15 px-2.5 py-0.5 rounded border border-[#cba158]/30">
                                {evt.bookingReference}
                              </span>
                              <span className="text-xs font-bold text-white uppercase tracking-wide">
                                {evt.eventType}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                                {evt.timeSlot}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-stone-400 flex-wrap pt-1">
                              <span className="flex items-center gap-1.5 text-white font-medium">
                                <Calendar className="w-3.5 h-3.5 text-[#cba158]" />
                                {new Date(evt.date).toLocaleDateString('en-IN', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-[#cba158]" />
                                <strong className="text-white">{evt.headcount} Guests</strong>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Building className="w-3.5 h-3.5 text-[#cba158]" />
                                {isHazratganj ? 'Hazratganj Royal Restaurant' : 'Highway Express Dhaba'}
                                <span className="text-stone-500">({evt.preferredHallOrArea || 'Main Hall'})</span>
                              </span>
                            </div>
                          </div>

                          {/* Right: Status Pill & Actions */}
                          <div className="flex items-center gap-3 self-start lg:self-center flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-stone-400 uppercase">Status:</span>
                              <select
                                value={evt.status}
                                onChange={(e) => handleUpdateEventStatus(evt.id, e.target.value as EventStatus)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border outline-none ${
                                  evt.status === 'CONFIRMED'
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600'
                                    : evt.status === 'PENDING'
                                    ? 'bg-amber-950/60 text-amber-300 border-amber-600 animate-pulse'
                                    : evt.status === 'COMPLETED'
                                    ? 'bg-blue-950/60 text-blue-300 border-blue-600'
                                    : 'bg-stone-900 text-stone-400 border-stone-700'
                                }`}
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="CONFIRMED">CONFIRMED</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="REJECTED">REJECTED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            </div>

                            <button
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="p-1.5 bg-stone-900 hover:bg-red-950 text-stone-400 hover:text-red-300 rounded border border-stone-800 transition-colors"
                              title="Delete booking"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
                          {/* Guest Contact */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Guest Contact</span>
                            <div className="font-semibold text-white">{evt.customerName}</div>
                            <div className="flex items-center gap-2 text-stone-400">
                              <a
                                href={`tel:${evt.customerPhone}`}
                                className="hover:text-[#cba158] transition-colors flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-[#cba158]" />
                                {evt.customerPhone}
                              </a>
                              <a
                                href={`https://wa.me/${evt.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `Namaste ${evt.customerName}, regarding your booking ${evt.bookingReference} for ${evt.eventType} at SHANGRILLA...`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900 transition-colors"
                              >
                                WhatsApp
                              </a>
                            </div>
                            {evt.customerEmail && (
                              <div className="text-[11px] text-stone-500">{evt.customerEmail}</div>
                            )}
                          </div>

                          {/* Catering Package & Financials */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Package & Financials</span>
                            <div className="font-medium text-[#e5c179]">{evt.packagePreference}</div>
                            <div className="text-stone-300">
                              Est. Total:{' '}
                              <strong className="text-emerald-400 font-mono">
                                ₹{evt.totalEstimatedAmount?.toLocaleString('en-IN') || 'TBD'}
                              </strong>
                              {evt.estimatedBudgetPerHead && (
                                <span className="text-stone-500 text-[10px]"> (₹{evt.estimatedBudgetPerHead}/pax)</span>
                              )}
                            </div>
                            <div className="text-stone-400">
                              Advance Paid:{' '}
                              <strong className={evt.advanceDepositPaid ? 'text-white' : 'text-amber-400'}>
                                ₹{(evt.advanceDepositPaid || 0).toLocaleString('en-IN')}
                              </strong>
                            </div>
                          </div>

                          {/* Requests & Notes */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Notes & Special Requests</span>
                            <p className="text-stone-300 italic line-clamp-2">
                              {evt.specialRequests || 'No special requests specified.'}
                            </p>
                            {evt.internalNotes && (
                              <div className="text-[10px] text-[#cba158] bg-[#cba158]/10 p-1.5 rounded border border-[#cba158]/20">
                                Staff note: {evt.internalNotes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {eventBookings.length === 0 && (
                  <div className="p-8 text-center rounded-2xl bg-[#181114] border border-stone-800 space-y-3">
                    <PartyPopper className="w-10 h-10 mx-auto text-[#cba158]" />
                    <h4 className="text-base font-bold text-white">No Event Bookings Yet</h4>
                    <p className="text-xs text-stone-400 max-w-sm mx-auto">
                      Create banquet and party booking requests for your Hazratganj banquet hall or Highway dhaba lawn.
                    </p>
                    <button
                      onClick={() => setShowBookEventModal(true)}
                      className="px-4 py-2 bg-[#cba158] hover:bg-[#dfb872] text-[#140e11] font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                    >
                      Create First Booking Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ROYAL LOYALTY PROGRAM */}
          {activeTab === 'loyalty' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#cba158]">
                      CUSTOMER RETENTION & REWARDS
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#cba158]/10 text-[#e5c179] border border-[#cba158]/30">
                      SHANGRILLA CLUB
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-white">
                    Royal Loyalty & Rewards Program
                  </h3>
                  <p className="text-xs text-stone-400">
                    Control points accrual, redemption rates, tiers (Bronze, Silver, Gold, Shahi Royal VIP), and member balances.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (loyaltyAccounts.length > 0) {
                      setSelectedAccountForAdjust(loyaltyAccounts[0]);
                      setShowAdjustPointsModal(true);
                    } else {
                      alert('No loyalty accounts registered yet. Accounts are created automatically when guests order.');
                    }
                  }}
                  className="px-4 py-2.5 bg-[#cba158] hover:bg-[#dfb872] text-[#140e11] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#cba158]/20"
                >
                  <Coins className="w-4 h-4" />
                  Adjust Member Points (+/-)
                </button>
              </div>

              {/* Metrics Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[#181114] border border-stone-800">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Total Members</span>
                  <div className="text-2xl font-bold font-mono text-white mt-0.5">
                    {loyaltyAccounts.length}
                  </div>
                  <span className="text-[10px] text-stone-500">Linked to mobile numbers</span>
                </div>

                <div className="p-4 rounded-xl bg-[#181114] border border-stone-800">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Outstanding Points</span>
                  <div className="text-2xl font-bold font-mono text-[#e5c179] mt-0.5">
                    {loyaltyAccounts.reduce((sum, a) => sum + (a.points || 0), 0)} <span className="text-xs font-sans text-stone-400">pts</span>
                  </div>
                  <span className="text-[10px] text-stone-500">Unredeemed rewards</span>
                </div>

                <div className="p-4 rounded-xl bg-[#181114] border border-stone-800">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Rupees Liability</span>
                  <div className="text-2xl font-bold font-mono text-rose-400 mt-0.5">
                    ₹{Math.round(loyaltyAccounts.reduce((sum, a) => sum + (a.points || 0), 0) * (loyaltySettings?.redemptionValuePerPoint || 0.5)).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-stone-500">At ₹{loyaltySettings?.redemptionValuePerPoint || 0.5}/point</span>
                </div>

                <div className="p-4 rounded-xl bg-[#181114] border border-stone-800">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">VIP Tier Guests</span>
                  <div className="text-2xl font-bold font-mono text-purple-300 mt-0.5">
                    {loyaltyAccounts.filter(a => a.tier === 'GOLD' || a.tier === 'SHAHI_ROYAL').length}
                  </div>
                  <span className="text-[10px] text-stone-500">Gold & Shahi Royal VIPs</span>
                </div>
              </div>

              {/* Settings Configuration Card */}
              {loyaltySettings && (
                <form onSubmit={handleSaveLoyaltySettings} className="p-5 rounded-2xl bg-[#1a1215] border border-[#cba158]/30 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                    <div>
                      <h4 className="font-serif font-bold text-base text-white">Program Rules & Currency Value</h4>
                      <p className="text-xs text-stone-400">Configure how guests earn points and redeem them for bill discounts.</p>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#cba158] hover:bg-[#dfb872] text-[#140e11] font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Rules
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="block text-stone-300 font-semibold mb-1">Earn Rate (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="25"
                          value={loyaltySettings.earnRatePercent}
                          onChange={(e) => setLoyaltySettings({ ...loyaltySettings, earnRatePercent: parseFloat(e.target.value) || 5 })}
                          className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-white font-mono"
                        />
                        <span className="absolute right-3 top-2 text-stone-500">%</span>
                      </div>
                      <span className="text-[10px] text-stone-500 mt-0.5 block">e.g. 5% = ₹5 worth per ₹100 spent</span>
                    </div>

                    <div>
                      <label className="block text-stone-300 font-semibold mb-1">Point Redemption Value</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="10"
                          value={loyaltySettings.redemptionValuePerPoint}
                          onChange={(e) => setLoyaltySettings({ ...loyaltySettings, redemptionValuePerPoint: parseFloat(e.target.value) || 0.5 })}
                          className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-white font-mono"
                        />
                        <span className="absolute right-3 top-2 text-stone-500">₹/pt</span>
                      </div>
                      <span className="text-[10px] text-stone-500 mt-0.5 block">100 points = ₹{(loyaltySettings.redemptionValuePerPoint * 100).toFixed(0)} off</span>
                    </div>

                    <div>
                      <label className="block text-stone-300 font-semibold mb-1">Min. Points to Redeem</label>
                      <input
                        type="number"
                        min="10"
                        step="10"
                        value={loyaltySettings.minPointsToRedeem}
                        onChange={(e) => setLoyaltySettings({ ...loyaltySettings, minPointsToRedeem: parseInt(e.target.value, 10) || 50 })}
                        className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-white font-mono"
                      />
                      <span className="text-[10px] text-stone-500 mt-0.5 block">Threshold to unlock discount</span>
                    </div>

                    <div>
                      <label className="block text-stone-300 font-semibold mb-1">Max Discount Cap (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={loyaltySettings.maxRedeemPercent}
                          onChange={(e) => setLoyaltySettings({ ...loyaltySettings, maxRedeemPercent: parseInt(e.target.value, 10) || 50 })}
                          className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-white font-mono"
                        />
                        <span className="absolute right-3 top-2 text-stone-500">% bill</span>
                      </div>
                      <span className="text-[10px] text-stone-500 mt-0.5 block">Prevents 100% loss per order</span>
                    </div>
                  </div>
                </form>
              )}

              {/* Members Directory */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <h4 className="font-serif font-bold text-base text-white">Registered Loyalty Members</h4>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-500" />
                      <input
                        type="text"
                        placeholder="Search by phone or name..."
                        value={loyaltySearch}
                        onChange={(e) => setLoyaltySearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#cba158]"
                      />
                    </div>
                    <select
                      value={loyaltyTierFilter}
                      onChange={(e) => setLoyaltyTierFilter(e.target.value)}
                      className="px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white"
                    >
                      <option value="all">All Tiers</option>
                      <option value="BRONZE">Bronze</option>
                      <option value="SILVER">Silver</option>
                      <option value="GOLD">Gold</option>
                      <option value="SHAHI_ROYAL">Shahi Royal</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#181114] border border-stone-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-stone-300">
                    <thead className="bg-black/40 text-[11px] uppercase tracking-wider text-stone-400 border-b border-stone-800">
                      <tr>
                        <th className="py-3 px-4">Phone Number</th>
                        <th className="py-3 px-4">Member Name</th>
                        <th className="py-3 px-4">Tier</th>
                        <th className="py-3 px-4">Orders & Spend</th>
                        <th className="py-3 px-4">Points Balance</th>
                        <th className="py-3 px-4">Value (₹)</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 font-sans">
                      {loyaltyAccounts
                        .filter(a => {
                          const matchTier = loyaltyTierFilter === 'all' || a.tier === loyaltyTierFilter;
                          const matchSearch = !loyaltySearch || (
                            a.phone.includes(loyaltySearch) ||
                            a.customerName.toLowerCase().includes(loyaltySearch.toLowerCase())
                          );
                          return matchTier && matchSearch;
                        })
                        .map((acc: any) => (
                          <tr key={acc.phone} className="hover:bg-stone-900/40">
                            <td className="py-3 px-4 font-mono font-medium text-white">{acc.phone}</td>
                            <td className="py-3 px-4 font-semibold text-stone-200">{acc.customerName}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                acc.tier === 'SHAHI_ROYAL'
                                  ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                                  : acc.tier === 'GOLD'
                                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                                  : acc.tier === 'SILVER'
                                  ? 'bg-slate-900 border-slate-600 text-slate-200'
                                  : 'bg-stone-900 border-stone-700 text-stone-300'
                              }`}>
                                {acc.tierLabel || acc.tier}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-white block font-mono">₹{acc.totalSpent?.toLocaleString('en-IN') || 0}</span>
                              <span className="text-[10px] text-stone-500">{acc.totalOrdersCount || 0} orders</span>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-[#e5c179]">
                              {acc.points || 0} pts
                            </td>
                            <td className="py-3 px-4 font-mono text-emerald-400">
                              ₹{(acc.rupeesWorth || Math.round((acc.points || 0) * (loyaltySettings?.redemptionValuePerPoint || 0.5))).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedAccountForAdjust(acc);
                                  setAdjustPointsValue(50);
                                  setShowAdjustPointsModal(true);
                                }}
                                className="px-2.5 py-1 bg-stone-800 hover:bg-[#cba158] hover:text-black text-stone-300 rounded text-xs transition-colors"
                              >
                                Adjust Points
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MENU MANAGER */}
          {activeTab === 'menu' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">Menu & Dishes Manager</h3>
                  <p className="text-xs text-stone-400">Add, edit, toggle availability, or manage Awadhi and Dhaba recipes</p>
                </div>
                <button
                  onClick={() => setShowAddDishModal(true)}
                  className="px-4 py-2 bg-[#cba158] hover:bg-[#dfb872] text-[#140e11] font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add New Dish
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.map(item => (
                  <div key={item.id} className="p-4 rounded-xl bg-[#181114] border border-stone-800 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif font-bold text-sm text-white">{item.name}</h4>
                        <span className="font-mono font-bold text-sm text-[#f8ecd4] tabular-nums shrink-0">
                          ₹{item.price}
                        </span>
                      </div>
                      {item.hindiName && <p className="text-xs text-[#cba158] font-serif">{item.hindiName}</p>}
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-stone-400">
                        <span className={`px-1.5 py-0.5 rounded ${item.isVeg ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'}`}>
                          {item.isVeg ? 'Veg' : 'Non-Veg'}
                        </span>
                        <span>{item.category}</span>
                        <span>·</span>
                        <span>{item.portionSize}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleDishAvailability(item)}
                        className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors ${
                          item.isAvailable
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950/80 text-red-300 border border-red-800'
                        }`}
                      >
                        {item.isAvailable ? 'In Stock' : 'Mark Sold Out'}
                      </button>

                      <button
                        onClick={() => handleDeleteDish(item.id)}
                        className="p-1.5 text-stone-500 hover:text-red-400 transition-colors"
                        title="Delete Dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: INVENTORY & STOCK FORECAST */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    Inventory & Intelligent Stock Forecasting
                  </h3>
                  <p className="text-xs text-stone-400">
                    Formula: Days Remaining = Usable Current Stock ÷ Estimated Average Daily Consumption
                  </p>
                </div>
              </div>

              <div className="bg-[#181114] border border-stone-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-black/40 text-[11px] uppercase tracking-wider text-stone-400 border-b border-stone-800">
                    <tr>
                      <th className="py-3 px-4">Ingredient</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Current Stock</th>
                      <th className="py-3 px-4">Avg Daily Usage</th>
                      <th className="py-3 px-4">Days Remaining</th>
                      <th className="py-3 px-4">Reorder Level</th>
                      <th className="py-3 px-4">Suggested PO Qty</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-sans">
                    {forecast.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-900/40">
                        <td className="py-3 px-4 font-medium text-white">{item.name}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-stone-400">{item.sku}</td>
                        <td className="py-3 px-4 font-mono font-bold text-stone-200">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-400">
                          {item.avgDailyConsumption} {item.unit}/day
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <span className={item.daysRemaining <= 3 ? 'text-red-400' : 'text-emerald-400'}>
                            {item.daysRemaining} Days
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-400">
                          {item.reorderLevel} {item.unit}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-[#e6c989]">
                          {item.suggestedPurchaseQty > 0 ? `${item.suggestedPurchaseQty} ${item.unit}` : 'Optimal'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.isCritical
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : item.isLowStock
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {item.isCritical ? 'Critical' : item.isLowStock ? 'Low Stock' : 'Good'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: RECIPES */}
          {activeTab === 'recipes' && (
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-lg text-white">Recipe & Ingredient Consumption Mapping</h3>
              <p className="text-xs text-stone-400">When orders are prepared, these ingredient quantities are automatically deducted from inventory.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipes.map(rcp => (
                  <div key={rcp.id} className="p-5 rounded-xl bg-[#181114] border border-stone-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-serif font-bold text-base text-white">{rcp.dishName}</h4>
                        <span className="text-[11px] text-stone-400">Yield: {rcp.yieldServings} Serving</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-stone-800">
                      <span className="text-[11px] uppercase font-bold text-[#cba158]">Required Ingredients</span>
                      <div className="space-y-1">
                        {rcp.ingredients.map((ing, i) => (
                          <div key={i} className="flex justify-between text-xs text-stone-300">
                            <span>{ing.ingredientName}</span>
                            <span className="font-mono text-stone-200">{ing.quantityRequired} {ing.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {rcp.preparationNotes && (
                      <p className="text-xs text-amber-200/80 italic pt-2 border-t border-stone-800/60">
                        Note: {rcp.preparationNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SUPPLIERS & PURCHASE ORDERS */}
          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">Purchase Orders & Deliveries</h3>
                  <p className="text-xs text-stone-400">Receiving a purchase order automatically updates inventory balances and creates a stock movement audit trail.</p>
                </div>
              </div>

              <div className="bg-[#181114] border border-stone-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-black/40 text-[11px] uppercase tracking-wider text-stone-400 border-b border-stone-800">
                    <tr>
                      <th className="py-3 px-4">PO Number</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Items Ordered</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-sans">
                    {purchaseOrders.map(po => (
                      <tr key={po.id} className="hover:bg-stone-900/40">
                        <td className="py-3 px-4 font-mono font-bold text-white">{po.poNumber}</td>
                        <td className="py-3 px-4">{po.supplierName}</td>
                        <td className="py-3 px-4 max-w-xs truncate">
                          {po.items.map(i => `${i.quantityOrdered} units of ${i.ingredientName}`).join(', ')}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">₹{po.totalAmount}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            po.status === 'RECEIVED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {po.status !== 'RECEIVED' ? (
                            <button
                              onClick={() => handleReceivePO(po.id)}
                              className="px-3 py-1 bg-[#cba158] hover:bg-[#dfb872] text-[#140e11] font-bold text-xs rounded transition-colors"
                            >
                              Receive Stock
                            </button>
                          ) : (
                            <span className="text-[11px] text-stone-400 font-mono">
                              Inv: {po.invoiceReference || 'Done'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TABLES & QR CODES */}
          {activeTab === 'tables' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Table QR Code Generator</h3>
                <p className="text-xs text-stone-400">
                  Generate table-specific scannable QR codes for dine-in guests. Download PNG or print tent cards.
                </p>
              </div>

              {locations.map(loc => (
                <div key={loc.id} className="p-5 rounded-2xl bg-[#181114] border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                    <div>
                      <h4 className="font-serif font-bold text-base text-white">{loc.name}</h4>
                      <p className="text-xs text-stone-400">{loc.address} · {loc.tablesCount} Tables Configured</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                    {Array.from({ length: loc.tablesCount || 10 }).map((_, i) => {
                      const tName = `Table ${i + 1}`;
                      return (
                        <button
                          key={i}
                          onClick={() => setQrModalTable({ location: loc, tableNumber: tName })}
                          className="p-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-[#cba158] rounded-xl text-center transition-all group"
                        >
                          <QrCode className="w-5 h-5 mx-auto text-[#cba158] mb-1 group-hover:scale-110 transition-transform" />
                          <span className="block font-medium text-xs text-white">{tName}</span>
                          <span className="text-[10px] text-stone-500">Get QR</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: ANALYTICS & PROFIT */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">Financial & Profit Analytics</h3>
                  <p className="text-xs text-stone-400">
                    Distinguishes revenue, cash received, UPI receipts, estimated food cost, and operating profit.
                  </p>
                </div>
                <button
                  onClick={exportSalesCsv}
                  className="px-3 py-1.5 bg-[#cba158] hover:bg-[#dfb872] text-[#140e11] font-bold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Complete Financial CSV
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#181114] border border-stone-800 space-y-2">
                  <span className="text-xs uppercase font-bold text-stone-400">Cash vs UPI Settlement</span>
                  <div className="pt-2 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-300">Cash Collected at Counter:</span>
                      <span className="font-mono font-bold text-white">₹{analytics?.totalCashCollected || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-300">Verified UPI Receipts:</span>
                      <span className="font-mono font-bold text-[#cba158]">₹{analytics?.totalUpiCollected || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#181114] border border-stone-800 space-y-2">
                  <span className="text-xs uppercase font-bold text-stone-400">Cost of Goods (Food Cost)</span>
                  <div className="pt-2 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-300">Estimated Raw Food Cost:</span>
                      <span className="font-mono font-bold text-stone-200">₹{analytics?.estimatedFoodCost || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-300">Gross Margin:</span>
                      <span className="font-mono font-bold text-emerald-400">₹{analytics?.estimatedGrossProfit || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#181114] border border-stone-800 space-y-2">
                  <span className="text-xs uppercase font-bold text-stone-400">Operating Expenses</span>
                  <div className="pt-2 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-300">Power, Rent & Fuel:</span>
                      <span className="font-mono font-bold text-stone-200">₹{analytics?.totalOperatingExpenses || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-300">Net Operating Profit:</span>
                      <span className="font-mono font-bold text-emerald-400">₹{analytics?.estimatedNetOperatingProfit || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CUSTOMER FEEDBACK & DISH REVIEWS */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">Customer Reviews & Dish Feedback</h3>
                  <p className="text-xs text-stone-400">
                    Real-time guest ratings, food quality scores, and dish-by-dish culinary reviews after order completion.
                  </p>
                </div>
                <div className="px-4 py-2 bg-[#1a1215] border border-stone-800 rounded-xl flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#cba158] fill-[#cba158]" />
                  <span className="font-mono font-bold text-base text-white">
                    {feedbacks.length > 0
                      ? (feedbacks.reduce((s, f) => s + f.overallRating, 0) / feedbacks.length).toFixed(1)
                      : '5.0'}
                  </span>
                  <span className="text-xs text-stone-400">({feedbacks.length} Reviews)</span>
                </div>
              </div>

              {feedbacks.length === 0 ? (
                <div className="p-12 text-center text-stone-500 bg-[#181114] border border-stone-800 rounded-2xl">
                  <MessageSquare className="w-10 h-10 text-stone-700 mx-auto mb-2" />
                  <p className="text-sm font-serif text-stone-300">No guest reviews submitted yet.</p>
                  <p className="text-xs text-stone-500 mt-1">
                    When guests complete dining and submit the feedback modal, their dish notes and ratings will appear here live.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feedbacks.map((fb: any) => (
                    <div
                      key={fb.id}
                      className="p-5 rounded-2xl bg-[#181114] border border-stone-800 space-y-3 shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-stone-800/80 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-base text-white">{fb.customerName}</span>
                            <span className="px-2 py-0.5 bg-[#cba158]/20 border border-[#cba158]/40 text-[#f8ecd4] rounded font-mono text-xs font-bold">
                              Order #{fb.displayNumber}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {new Date(fb.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            {fb.customerPhone ? ` · ${fb.customerPhone}` : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[#cba158]">
                          {Array.from({ length: fb.overallRating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-[#cba158]" />
                          ))}
                        </div>
                      </div>

                      {fb.comment && (
                        <p className="text-xs text-stone-300 italic bg-black/30 p-2.5 rounded-lg border border-stone-800/60">
                          "{fb.comment}"
                        </p>
                      )}

                      {fb.dishReviews && fb.dishReviews.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] uppercase font-bold text-[#cba158] block">Dish Ratings</span>
                          <div className="space-y-1">
                            {fb.dishReviews.map((dr: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-xs text-stone-300 bg-stone-900/40 px-2.5 py-1.5 rounded-md">
                                <span className="font-medium text-white">{dr.dishName}</span>
                                <div className="flex items-center gap-2">
                                  {dr.comment && (
                                    <span className="text-[10px] text-stone-400 italic truncate max-w-[150px]">
                                      {dr.comment}
                                    </span>
                                  )}
                                  <span className="font-mono text-[#e6c989] font-bold">
                                    {dr.rating}★
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: WEBSITE & VIDEO EDITOR */}
          {activeTab === 'website' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Website Design & Media Editor</h3>
                <p className="text-xs text-stone-400">
                  Manage homepage banners, headline typography, brand story, and the homepage video showcase.
                </p>
              </div>

              {savedSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{savedSuccess}</span>
                </div>
              )}

              <div className="p-6 rounded-2xl bg-[#181114] border border-stone-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Homepage Hero Title
                  </label>
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#cba158]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Homepage Hero Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#cba158]"
                  />
                </div>

                {/* Homepage Video Showcase URL */}
                <div className="p-4 bg-stone-900/60 border border-stone-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#cba158]">
                    <Video className="w-4 h-4" />
                    <span>Homepage Video Showcase (Active Reel)</span>
                  </div>
                  <input
                    type="text"
                    value={homepageVideoUrl}
                    onChange={(e) => setHomepageVideoUrl(e.target.value)}
                    placeholder="/assets/shangrilla-live-kitchen.mp4"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white font-mono"
                  />
                  <p className="text-[11px] text-stone-400">
                    Default active video: <code className="text-[#e6c989]">/assets/shangrilla-live-kitchen.mp4</code>.
                    You can replace with custom MP4 or hosted media URL.
                  </p>
                </div>

                {/* Promotional Announcement Banner */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-stone-300">
                      Top Announcement Banner Text
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-stone-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showBanner}
                        onChange={(e) => setShowBanner(e.target.checked)}
                        className="rounded text-[#cba158]"
                      />
                      Show on Site
                    </label>
                  </div>
                  <input
                    type="text"
                    value={announcementBanner}
                    onChange={(e) => setAnnouncementBanner(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#cba158]"
                  />
                </div>

                <div className="pt-3 border-t border-stone-800">
                  <button
                    onClick={handleSaveWebsiteConfig}
                    className="px-6 py-2.5 bg-[#cba158] hover:bg-[#dfb872] text-[#140e11] font-bold text-xs rounded-lg transition-colors shadow-lg flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Publish Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-lg text-white">System Security & Audit Trail</h3>
              <p className="text-xs text-stone-400">Every sensitive action, price change, stock deduction, and payment verification is permanently recorded.</p>

              <div className="bg-[#181114] border border-stone-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-black/40 text-[11px] uppercase tracking-wider text-stone-400 border-b border-stone-800">
                    <tr>
                      <th className="py-3 px-4">Time (IST)</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-sans">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-stone-900/40">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-stone-400">
                          {new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-white">{log.action}</td>
                        <td className="py-2.5 px-4 text-stone-400">{log.entityType}</td>
                        <td className="py-2.5 px-4 text-[#e6c989]">{log.changedBy}</td>
                        <td className="py-2.5 px-4 text-stone-300">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: BACKUP & RECOVERY */}
          {activeTab === 'backup' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Database Backup & Recovery</h3>
                <p className="text-xs text-stone-400">Export or restore the complete JSON database snapshot including menus, orders, inventory, and counters.</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#181114] border border-stone-800 space-y-4">
                <div>
                  <h4 className="font-semibold text-white text-sm">Download Authoritative Backup</h4>
                  <p className="text-xs text-stone-400 mt-1">
                    Downloads complete snapshot in JSON format containing orders, counters, recipes, and inventory history.
                  </p>
                  <button
                    onClick={async () => {
                      const backup = await api.exportBackup();
                      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `shangrilla-backup-${Date.now()}.json`;
                      a.click();
                    }}
                    className="mt-3 px-4 py-2 bg-[#cba158] hover:bg-[#dfb872] text-[#140e11] font-bold text-xs rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Database Snapshot
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add New Dish Modal */}
      {showAddDishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#191215] border border-[#cba158]/50 rounded-2xl p-6 text-stone-100 shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-white mb-4">Add New Menu Dish</h3>
            <form onSubmit={handleSaveDish} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 mb-1">Dish Name (English)</label>
                <input
                  type="text"
                  required
                  value={newDish.name}
                  onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                  placeholder="e.g. Kakori Kebab Lazeez"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1">Hindi / Awadhi Name</label>
                <input
                  type="text"
                  value={newDish.hindiName || ''}
                  onChange={(e) => setNewDish({ ...newDish, hindiName: e.target.value })}
                  placeholder="e.g. काकोरी कबाब लज़ीज़"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-300 mb-1">Category</label>
                  <select
                    value={newDish.category}
                    onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-white"
                  >
                    <option value="Awadhi Specials">Awadhi Specials</option>
                    <option value="Starters">Starters & Kebabs</option>
                    <option value="Main Course">Main Course Curries</option>
                    <option value="Breads">Tandoor Breads</option>
                    <option value="Desserts">Mithai & Desserts</option>
                    <option value="Beverages">Beverages & Chai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDish.description}
                  onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                  placeholder="Tell your guests about the royal ingredients and cooking method..."
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-stone-300 p-2 bg-stone-900 rounded-lg border border-stone-800">
                  <input
                    type="checkbox"
                    checked={newDish.isVeg}
                    onChange={(e) => setNewDish({ ...newDish, isVeg: e.target.checked })}
                    className="rounded text-[#cba158]"
                  />
                  <span>Pure Vegetarian</span>
                </label>

                <div>
                  <select
                    value={newDish.locationId}
                    onChange={(e) => setNewDish({ ...newDish, locationId: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-white"
                  >
                    <option value="all">Both Locations</option>
                    <option value="shangrilla-hazratganj">Hazratganj Only</option>
                    <option value="shangrilla-highway-dhaba">Highway Dhaba Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDishModal(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#cba158] hover:bg-[#dfb872] text-[#140e11] font-bold rounded-lg"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table QR Modal */}
      {qrModalTable && (
        <TableQRCodeModal
          location={qrModalTable.location}
          tableNumber={qrModalTable.tableNumber}
          onClose={() => setQrModalTable(null)}
          onSelectTableUrl={(url) => {
            if (onOpenTableOrdering) {
              onOpenTableOrdering(url);
            }
          }}
        />
      )}

      {/* Bill Preview Modal */}
      {viewBillOrder && (
        <DigitalBillModal
          order={viewBillOrder}
          onClose={() => setViewBillOrder(null)}
          onTrackOrder={() => setViewBillOrder(null)}
        />
      )}

      {/* Book an Event Modal for Admin */}
      {showBookEventModal && (
        <BookEventModal
          isOpen={showBookEventModal}
          onClose={() => setShowBookEventModal(false)}
          defaultLocationId={selectedLocationId !== 'all' ? selectedLocationId : 'shangrilla-hazratganj'}
          onEventCreated={(newEvent) => {
            setEventBookings(prev => [newEvent, ...prev]);
          }}
        />
      )}

      {/* Adjust Member Points Modal */}
      {showAdjustPointsModal && selectedAccountForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#191215] border border-[#cba158]/50 rounded-2xl p-6 text-stone-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#cba158]" />
                <h3 className="text-lg font-serif font-bold text-white">Adjust Member Points</h3>
              </div>
              <button
                onClick={() => setShowAdjustPointsModal(false)}
                className="p-1 rounded text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustPointsSubmit} className="space-y-4 pt-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-400">Customer Name:</span>
                  <strong className="text-white">{selectedAccountForAdjust.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Phone Number:</span>
                  <span className="font-mono text-stone-200">{selectedAccountForAdjust.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Current Balance:</span>
                  <strong className="text-[#e5c179] font-mono">{selectedAccountForAdjust.points} points</strong>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Points Adjustment (+ to Credit, - to Debit)
                </label>
                <input
                  type="number"
                  step="5"
                  value={adjustPointsValue}
                  onChange={(e) => setAdjustPointsValue(parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g. 50 or -20"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-white font-mono text-sm"
                  required
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  New balance will be: <strong>{Math.max(0, (selectedAccountForAdjust.points || 0) + adjustPointsValue)} points</strong>
                </span>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Reason / Note for Audit Trail</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. VIP guest goodwill bonus, Anniversary gift"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-white"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustPointsModal(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-5 py-2 bg-[#cba158] hover:bg-[#dfb872] text-[#140e11] font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isAdjusting ? 'Saving...' : 'Apply Points Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
