export interface Location {
  id: string;
  name: string;
  code: 'RESTAURANT' | 'DHABA';
  tagline: string;
  address: string;
  phone: string;
  upiId: string;
  upiName: string;
  gstNumber: string;
  gstRate: number; // e.g. 5 for 5% (2.5% CGST + 2.5% SGST)
  openingHours: string;
  tablesCount: number;
}

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'PRE_ORDER';
export type KitchenStatus = 'RECEIVED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COLLECTED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
export type PaymentMethod = 'UPI_QR' | 'CASH_AT_COUNTER' | 'CARD';
export type UserRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'CUSTOMER';

export interface MenuItemAddon {
  id: string;
  name: string;
  price: number;
}

export interface MenuItemCustomizationGroup {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: MenuItemAddon[];
}

export interface MenuItem {
  id: string;
  locationId: string; // 'all' or specific location
  name: string;
  hindiName?: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  discountedPrice?: number;
  isVeg: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  portionSize: string;
  spiceLevel: 'Mild' | 'Medium' | 'Spicy' | 'Royal Fiery';
  preparationTimeMinutes: number;
  allergens?: string[];
  imageUrl: string;
  customizationGroups?: MenuItemCustomizationGroup[];
  recipeId?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedAddons?: { name: string; price: number }[];
  specialInstructions?: string;
  totalPrice: number;
}

export interface Order {
  id: string; // Permanent UUID
  displayNumber: string; // e.g. '024'
  cycleId: string; // e.g. 'CYCLE-2026-10-22-00'
  locationId: string;
  locationName: string;
  orderType: OrderType;
  tableNumber?: string;
  customerName: string;
  customerPhone: string;
  customerNotes?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  pointsRedeemed?: number;
  pointsDiscount?: number;
  cgst: number;
  sgst: number;
  total: number;
  kitchenStatus: KitchenStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paidAt?: string;
  paidVerifiedBy?: string;
  createdAt: string;
  updatedAt: string;
  readyAt?: string;
  collectedAt?: string;
  pickupTime?: string; // for pre-orders
  statusHistory: {
    status: KitchenStatus;
    timestamp: string;
    changedBy: string;
    note?: string;
  }[];
}

export interface Ingredient {
  id: string;
  name: string;
  sku: string;
  category: 'raw' | 'packaged' | 'beverage' | 'dairy' | 'packaging';
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs';
  currentStock: number;
  reorderLevel: number;
  safetyStock: number;
  purchasePricePerUnit: number;
  supplierId: string;
  locationId: string; // or 'all'
  expiryDate?: string;
}

export interface RecipeItem {
  ingredientId: string;
  ingredientName: string;
  quantityRequired: number; // in ingredient's base unit
  unit: string;
}

export interface Recipe {
  id: string;
  menuItemId: string;
  dishName: string;
  yieldServings: number;
  ingredients: RecipeItem[];
  preparationNotes?: string;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  locationId: string;
  type: 'OPENING' | 'PURCHASE' | 'ORDER_CONSUMPTION' | 'WASTAGE' | 'SPOILAGE' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  balanceAfter: number;
  reason: string;
  referenceOrderId?: string;
  performedBy: string;
  timestamp: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  leadTimeDays: number;
  suppliedItems: string[];
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  locationId: string;
  status: 'DRAFT' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  items: {
    ingredientId: string;
    ingredientName: string;
    quantityOrdered: number;
    unitPrice: number;
    quantityReceived?: number;
  }[];
  totalAmount: number;
  createdAt: string;
  expectedDeliveryDate: string;
  receivedAt?: string;
  invoiceReference?: string;
}

export interface ExpenseRecord {
  id: string;
  locationId: string;
  category: 'RENT' | 'ELECTRICITY' | 'SALARY' | 'SUPPLIES' | 'MAINTENANCE' | 'TRANSPORT' | 'MISC';
  title: string;
  amount: number;
  paidDate: string;
  paidTo: string;
  notes?: string;
}

export interface Coupon {
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  locationId?: string; // all or specific
  validUntil: string;
  usageLimit: number;
  timesUsed: number;
  isActive: boolean;
}

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'SHAHI_ROYAL';

export interface LoyaltySettings {
  earnRatePercent: number; // e.g. 5% = 5 points per ₹100
  redemptionValuePerPoint: number; // e.g. ₹0.50 per point
  minPointsToRedeem: number; // e.g. 50
  maxRedeemPercent: number; // e.g. 50% of subtotal
  pointsExpiryDays: number;
  tiers: {
    name: LoyaltyTier;
    label: string;
    minSpent: number;
    multiplier: number; // e.g. 1.0x, 1.25x, 1.5x, 2.0x
    perks: string[];
  }[];
}

export interface LoyaltyAccount {
  phone: string;
  customerName: string;
  customerEmail?: string;
  points: number;
  totalOrdersCount: number;
  totalSpent: number;
  tier: LoyaltyTier;
  createdAt?: string;
  history: {
    id?: string;
    orderId?: string;
    pointsChange: number;
    reason: string;
    timestamp: string;
  }[];
}

export interface WebsiteConfig {
  heroTitle: string;
  heroSubtitle: string;
  storyHeading: string;
  storyParagraph: string;
  announcementBanner: string;
  showBanner: boolean;
  contactPhone: string;
  contactEmail: string;
  restaurantHours: string;
  dhabaHours: string;
  featuredCategory: string;
  galleryImages: string[];
  tvPlaylist: {
    id: string;
    title: string;
    type: 'IMAGE' | 'VIDEO' | 'ANNOUNCEMENT';
    url: string;
    durationSeconds: number;
    active: boolean;
  }[];
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'ORDER' | 'PAYMENT' | 'MENU' | 'INVENTORY' | 'STAFF' | 'SETTINGS';
  entityId: string;
  changedBy: string;
  details: string;
  timestamp: string;
}

export interface DishFeedback {
  menuItemId: string;
  dishName: string;
  rating: number; // 1 to 5
  comment?: string;
}

export interface CustomerFeedback {
  id: string;
  orderId: string;
  displayNumber: string;
  customerName: string;
  customerPhone: string;
  overallRating: number; // 1 to 5
  foodQualityRating: number; // 1 to 5
  serviceRating: number; // 1 to 5
  dishReviews: DishFeedback[];
  comment: string;
  locationId: string;
  createdAt: string;
}

export type EventType =
  | 'Wedding & Reception'
  | 'Corporate Conference & Dinner'
  | 'Birthday Celebration'
  | 'Anniversary Gala'
  | 'Awadhi Dastarkhwan Family Feast'
  | 'Kitty Party & Hi-Tea'
  | 'Cocktail & Sangeet'
  | 'Other Special Occasion';

export type EventStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface EventBooking {
  id: string;
  bookingReference: string; // e.g. EVT-2026-081
  eventType: EventType;
  headcount: number;
  date: string; // YYYY-MM-DD
  timeSlot: 'LUNCH' | 'DINNER' | 'FULL_DAY';
  preferredLocationId: string; // 'shangrilla-hazratganj' or 'shangrilla-highway-dhaba'
  preferredHallOrArea?: string; // 'Royal Darbar Hall', 'Mughal Private Dining', 'Highway Open Lawn', 'VIP Pavilions'
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  packagePreference?: string; // 'Royal Awadhi Platinum', 'Awadhi Dastarkhwan Feast', 'Highway Tandoor BBQ Buffet', 'Customized Ala-Carte'
  estimatedBudgetPerHead?: number;
  totalEstimatedAmount?: number;
  advanceDepositPaid?: number;
  status: EventStatus;
  specialRequests?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TableBookingStatus = 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED';

export interface TableBooking {
  id: string;
  bookingRef: string; // e.g. TBL-2026-101
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  locationId: string;
  locationName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. '19:30'
  guestCount: number;
  seatingArea: string; // 'AC Royal Darbar Hall' | 'Highway Charpai Lawn' | 'Open Sky Terrace' | 'Family VIP Cabin'
  specialRequests?: string;
  status: TableBookingStatus;
  tableAssigned?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberProfile {
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  anniversary?: string;
  preferredLocationId?: string;
}



