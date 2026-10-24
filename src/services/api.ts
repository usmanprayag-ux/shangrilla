import { Location, MenuItem, Order, WebsiteConfig, KitchenStatus, PaymentStatus, EventBooking, EventStatus, LoyaltyAccount, LoyaltySettings, MemberProfile } from '../types/models';

type SSEListener = (event: { type: string; data: any }) => void;

class ApiClient {
  private sse: EventSource | null = null;
  private listeners: Set<SSEListener> = new Set();
  private reconnectTimer: any = null;

  constructor() {
    this.connectSSE();
  }

  public connectSSE(): void {
    if (typeof window === 'undefined') return;
    if (this.sse) {
      this.sse.close();
    }

    try {
      this.sse = new EventSource('/api/realtime/stream');

      const handleEvent = (type: string) => (evt: MessageEvent) => {
        try {
          const data = JSON.parse(evt.data);
          this.notifyListeners({ type, data });
        } catch (e) {
          console.error(`Error parsing SSE event ${type}:`, e);
        }
      };

      this.sse.addEventListener('connected', handleEvent('connected'));
      this.sse.addEventListener('new_order', handleEvent('new_order'));
      this.sse.addEventListener('order_status_updated', handleEvent('order_status_updated'));
      this.sse.addEventListener('payment_updated', handleEvent('payment_updated'));
      this.sse.addEventListener('order_modified', handleEvent('order_modified'));
      this.sse.addEventListener('menu_updated', handleEvent('menu_updated'));
      this.sse.addEventListener('website_config_updated', handleEvent('website_config_updated'));

      this.sse.onerror = () => {
        if (this.sse) this.sse.close();
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connectSSE();
          }, 4000);
        }
      };
    } catch (e) {
      console.warn('SSE connection failed, will retry:', e);
    }
  }

  public subscribe(fn: SSEListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notifyListeners(payload: { type: string; data: any }): void {
    for (const fn of this.listeners) {
      try {
        fn(payload);
      } catch (e) {
        console.error('SSE listener threw error:', e);
      }
    }
  }

  // --- Locations ---
  public async getLocations(): Promise<Location[]> {
    const res = await fetch('/api/locations');
    const json = await res.json();
    return json.data || [];
  }

  // --- Menu ---
  public async getMenu(locationId?: string): Promise<MenuItem[]> {
    const url = locationId ? `/api/menu?locationId=${locationId}` : '/api/menu';
    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  }

  public async saveMenuItem(item: Partial<MenuItem>): Promise<MenuItem> {
    const method = item.id ? 'PUT' : 'POST';
    const url = item.id ? `/api/menu/${item.id}` : '/api/menu';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to save dish');
    return json.data;
  }

  public async deleteMenuItem(id: string): Promise<void> {
    const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete dish');
  }

  // --- Orders ---
  public async getOrders(params?: {
    locationId?: string;
    status?: string;
    paymentStatus?: string;
    search?: string;
    phone?: string;
  }): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params?.locationId) query.set('locationId', params.locationId);
    if (params?.status) query.set('status', params.status);
    if (params?.paymentStatus) query.set('paymentStatus', params.paymentStatus);
    if (params?.search) query.set('search', params.search);
    if (params?.phone) query.set('phone', params.phone);

    const res = await fetch(`/api/orders?${query.toString()}`);
    const json = await res.json();
    return json.data || [];
  }

  public async getOrderById(id: string): Promise<Order> {
    const res = await fetch(`/api/orders/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Order not found');
    return json.data;
  }

  public async createOrder(orderData: any): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Order placement failed');
    return json.data;
  }

  public async updateOrderStatus(id: string, status: KitchenStatus, operator?: string, note?: string): Promise<Order> {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, operator, note })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update order status');
    return json.data;
  }

  public async updateOrderPayment(
    id: string,
    paymentStatus: PaymentStatus,
    paymentMethod?: string,
    paymentReference?: string,
    operator?: string
  ): Promise<Order> {
    const res = await fetch(`/api/orders/${id}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus, paymentMethod, paymentReference, operator })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to confirm payment');
    return json.data;
  }

  public async modifyOrder(id: string, customerNotes: string): Promise<Order> {
    const res = await fetch(`/api/orders/${id}/modify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerNotes })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to modify order');
    return json.data;
  }

  // --- Collection TV Queue ---
  public async getTvOrders(locationId?: string): Promise<{ ready: any[]; preparing: any[] }> {
    const url = locationId ? `/api/tv/ready-orders?locationId=${locationId}` : '/api/tv/ready-orders';
    const res = await fetch(url);
    const json = await res.json();
    return json.data || { ready: [], preparing: [] };
  }

  // --- Inventory & Forecasting ---
  public async getInventory(): Promise<{ ingredients: any[]; movements: any[] }> {
    const res = await fetch('/api/inventory');
    const json = await res.json();
    return json.data;
  }

  public async recordStockMovement(data: any): Promise<any> {
    const res = await fetch('/api/inventory/movement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to record movement');
    return json.data;
  }

  public async getStockForecast(): Promise<any[]> {
    const res = await fetch('/api/inventory/forecast');
    const json = await res.json();
    return json.data || [];
  }

  // --- Suppliers & POs ---
  public async getSuppliers(): Promise<any[]> {
    const res = await fetch('/api/suppliers');
    const json = await res.json();
    return json.data || [];
  }

  public async getPurchaseOrders(): Promise<any[]> {
    const res = await fetch('/api/purchase-orders');
    const json = await res.json();
    return json.data || [];
  }

  public async createPurchaseOrder(po: any): Promise<any> {
    const res = await fetch('/api/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(po)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create PO');
    return json.data;
  }

  public async receivePurchaseOrder(id: string, invoiceReference?: string): Promise<any> {
    const res = await fetch(`/api/purchase-orders/${id}/receive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceReference })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to mark PO received');
    return json.data;
  }

  // --- Recipes ---
  public async getRecipes(): Promise<any[]> {
    const res = await fetch('/api/recipes');
    const json = await res.json();
    return json.data || [];
  }

  // --- Analytics ---
  public async getAnalytics(locationId?: string): Promise<any> {
    const url = locationId ? `/api/analytics?locationId=${locationId}` : '/api/analytics';
    const res = await fetch(url);
    const json = await res.json();
    return json.data;
  }

  // --- Coupons & Loyalty ---
  public async validateCoupon(code: string, subtotal: number): Promise<{ code: string; discount: number; discountType: string }> {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Coupon validation failed');
    return json.data;
  }

  // --- Website Config ---
  public async getWebsiteConfig(): Promise<WebsiteConfig> {
    const res = await fetch('/api/website-config');
    const json = await res.json();
    return json.data;
  }

  public async updateWebsiteConfig(cfg: Partial<WebsiteConfig>): Promise<WebsiteConfig> {
    const res = await fetch('/api/website-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });
    const json = await res.json();
    return json.data;
  }

  // --- Audit Logs ---
  public async getAuditLogs(): Promise<any[]> {
    const res = await fetch('/api/audit-logs');
    const json = await res.json();
    return json.data || [];
  }

  // --- Backup & Restore ---
  public async exportBackup(): Promise<any> {
    const res = await fetch('/api/system/export');
    return res.json();
  }

  public async restoreBackup(data: any): Promise<void> {
    const res = await fetch('/api/system/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Restore failed');
  }
  // --- Customer Feedback & Reviews ---
  public async submitFeedback(feedbackData: any): Promise<any> {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to submit feedback');
    return json.data;
  }

  public async getFeedback(params?: { locationId?: string; orderId?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.locationId) query.set('locationId', params.locationId);
    if (params?.orderId) query.set('orderId', params.orderId);

    const res = await fetch(`/api/feedback?${query.toString()}`);
    const json = await res.json();
    return json.data || [];
  }

  // --- Order History ---
  public async getOrderHistory(phone: string): Promise<Order[]> {
    const res = await fetch(`/api/orders/history?phone=${encodeURIComponent(phone)}`);
    const json = await res.json();
    return json.data || [];
  }

  // --- Banquet & Event Bookings ---
  public async getEvents(params?: {
    locationId?: string;
    status?: string;
    search?: string;
  }): Promise<EventBooking[]> {
    const query = new URLSearchParams();
    if (params?.locationId) query.set('locationId', params.locationId);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`/api/events?${query.toString()}`);
    const json = await res.json();
    return json.data || [];
  }

  public async getEventById(id: string): Promise<EventBooking> {
    const res = await fetch(`/api/events/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Event booking not found');
    return json.data;
  }

  public async createEvent(data: Partial<EventBooking>): Promise<EventBooking> {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to submit event booking request');
    return json.data;
  }

  public async updateEvent(id: string, updates: Partial<EventBooking> & { operator?: string }): Promise<EventBooking> {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update event booking');
    return json.data;
  }

  public async deleteEvent(id: string, operator?: string): Promise<void> {
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete event booking');
  }

  // --- Loyalty Program ---
  public async getLoyaltySettings(): Promise<LoyaltySettings> {
    const res = await fetch('/api/loyalty/settings');
    const json = await res.json();
    return json.data;
  }

  public async updateLoyaltySettings(settings: Partial<LoyaltySettings> & { operator?: string }): Promise<LoyaltySettings> {
    const res = await fetch('/api/loyalty/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update loyalty settings');
    return json.data;
  }

  public async getLoyaltyAccount(phone: string): Promise<any> {
    const res = await fetch(`/api/loyalty/account?phone=${encodeURIComponent(phone)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to lookup loyalty account');
    return json.data;
  }

  public async getLoyaltyAccounts(params?: { search?: string; tier?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.tier) query.set('tier', params.tier);

    const res = await fetch(`/api/loyalty/accounts?${query.toString()}`);
    const json = await res.json();
    return json.data || [];
  }

  public async adjustLoyaltyPoints(payload: {
    phone: string;
    pointsDelta: number;
    reason?: string;
    operator?: string;
  }): Promise<LoyaltyAccount> {
    const res = await fetch('/api/loyalty/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to adjust points');
    return json.data;
  }

  // --- Member Registration ---
  public async registerMember(profile: MemberProfile): Promise<any> {
    const res = await fetch('/api/members/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to register membership');
    return json.data;
  }

  // --- Staff Authentication ---
  public async staffLogin(credentials: { username: string; password: string }): Promise<{
    success: boolean;
    role: 'kitchen' | 'cashier' | 'admin';
    name: string;
    location: string;
  }> {
    const res = await fetch('/api/auth/staff-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Invalid credentials');
    return json;
  }

  // --- Gemini Chatbot Concierge ---
  public async sendChatMessage(
    message: string,
    history: Array<{ role: 'user' | 'model'; content: string }> = [],
    locationId?: string
  ): Promise<{ reply: string; suggestedDishes?: MenuItem[]; offerCode?: string }> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, locationId })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Chat request failed');
    return json.data;
  }
}

export const api = new ApiClient();

