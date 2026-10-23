import fs from 'fs';
import path from 'path';
import {
  Location,
  MenuItem,
  Order,
  Ingredient,
  Recipe,
  StockMovement,
  Supplier,
  PurchaseOrder,
  ExpenseRecord,
  Coupon,
  LoyaltyAccount,
  WebsiteConfig,
  AuditLog,
  CustomerFeedback,
  EventBooking,
  TableBooking,
  LoyaltySettings
} from '../src/types/models';

export interface DatabaseSchema {
  locations: Location[];
  menuItems: MenuItem[];
  orders: Order[];
  orderCounters: Record<string, { cycleId: string; counter: number }>;
  ingredients: Ingredient[];
  recipes: Recipe[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  expenses: ExpenseRecord[];
  coupons: Coupon[];
  loyaltyAccounts: LoyaltyAccount[];
  loyaltySettings: LoyaltySettings;
  eventBookings: EventBooking[];
  tableBookings: TableBooking[];
  websiteConfig: WebsiteConfig;
  auditLogs: AuditLog[];
  feedbacks: CustomerFeedback[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'shangrilla-db.json');

// Helper to calculate current 48-hour cycle ID in Asia/Kolkata timezone
export function getCurrent48HourCycleId(): string {
  // Asia/Kolkata is UTC+5:30 (19800000 ms)
  const KOLKATA_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const kolkataNow = new Date(Date.now() + KOLKATA_OFFSET_MS);
  
  // Calculate 48-hour epoch bucket
  const epochDays = Math.floor(kolkataNow.getTime() / (24 * 60 * 60 * 1000));
  const cycleNumber = Math.floor(epochDays / 2);
  
  const yyyy = kolkataNow.getUTCFullYear();
  const mm = String(kolkataNow.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kolkataNow.getUTCDate()).padStart(2, '0');
  
  return `CYCLE-${yyyy}${mm}${dd}-${cycleNumber}`;
}

const initialLocations: Location[] = [
  {
    id: 'shangrilla-hazratganj',
    name: 'SHANGRILLA Royal Restaurant',
    code: 'RESTAURANT',
    tagline: 'Royal Awadhi Fine Dining & Dastarkhwan Heritage',
    address: '14/B, Mahatma Gandhi Marg, Hazratganj, Lucknow, UP 226001',
    phone: '+91 522 261 4892',
    upiId: 'shangrilla.royal@icici',
    upiName: 'SHANGRILLA RESTAURANT LUCKNOW',
    gstNumber: '09AAACS1234F1Z5',
    gstRate: 5,
    openingHours: '12:00 PM – 11:30 PM (Daily)',
    tablesCount: 20
  },
  {
    id: 'shangrilla-highway-dhaba',
    name: 'SHANGRILLA Highway Express Dhaba',
    code: 'DHABA',
    tagline: 'Authentic Charcoal Tandoor & 24x7 Highway Experience',
    address: 'NH-27, Lucknow-Ayodhya Highway, Near Matiyari Chauraha, Lucknow, UP 226028',
    phone: '+91 98390 12899',
    upiId: 'shangrilla.dhaba@icici',
    upiName: 'SHANGRILLA HIGHWAY DHABA',
    gstNumber: '09AAACS1234F1Z5',
    gstRate: 5,
    openingHours: 'Open 24 Hours · 7 Days a Week',
    tablesCount: 30
  }
];

const initialMenuItems: MenuItem[] = [
  {
    id: 'dish-galouti-kebab',
    locationId: 'all',
    name: 'Galouti Kebab with Ulte Tawe Ka Paratha',
    hindiName: 'गलौटी कबाब और उल्टे तवे का पराठा',
    description: 'Silken tender Awadhi spiced minced mutton patties smoked with cloves, melting effortlessly on your palate. Served with 2 saffron parathas, lachha onions & fresh mint chutney.',
    category: 'Awadhi Specials',
    subcategory: 'Kebabs & Starters',
    price: 360,
    isVeg: false,
    isFeatured: true,
    isAvailable: true,
    portionSize: '4 Kebabs + 2 Parathas',
    spiceLevel: 'Medium',
    preparationTimeMinutes: 18,
    allergens: ['Dairy', 'Gluten', 'Nuts'],
    imageUrl: '/public/assets/aistudio/WhatsApp_Image_2026-10-23_at_8.37.33_AM_822d0b5b.jpeg',
    customizationGroups: [
      {
        id: 'cg-galouti-extra',
        name: 'Extra Paratha & Chutney',
        required: false,
        minSelect: 0,
        maxSelect: 2,
        options: [
          { id: 'opt-paratha', name: 'Extra Ulte Tawe Ka Paratha (1 Pc)', price: 45 },
          { id: 'opt-chutney', name: 'Extra Royal Mint Chutney Jar', price: 25 }
        ]
      }
    ]
  },
  {
    id: 'dish-dum-biryani',
    locationId: 'all',
    name: 'Royal Lucknowi Awadhi Dum Biryani (Chicken)',
    hindiName: 'अवधी दम बिरयानी (चिकन)',
    description: 'Long-grain aged basmati rice layered with succulent marinated chicken, saffron milk, kewra water, and caramelized onions, sealed in an earthen handi with dough and slow-cooked over gentle charcoal.',
    category: 'Awadhi Specials',
    subcategory: 'Biryani & Rice',
    price: 390,
    isVeg: false,
    isFeatured: true,
    isAvailable: true,
    portionSize: 'Serves 1-2 (750g Handi)',
    spiceLevel: 'Medium',
    preparationTimeMinutes: 22,
    allergens: ['Dairy'],
    imageUrl: '/public/assets/aistudio/WhatsApp_Image_2026-10-23_at_8.37.33_AM_822d0b5b.jpeg',
    customizationGroups: [
      {
        id: 'cg-biryani-raita',
        name: 'Raita Accompaniment',
        required: false,
        minSelect: 0,
        maxSelect: 1,
        options: [
          { id: 'opt-burhani-raita', name: 'Burhani Garlic Raita (Recommended)', price: 40 },
          { id: 'opt-boondi-raita', name: 'Crispy Boondi Raita', price: 35 }
        ]
      }
    ]
  },
  {
    id: 'dish-dal-makhani-dhaba',
    locationId: 'all',
    name: 'Highway Dhaba Charcoal Dal Makhani',
    hindiName: 'ढाबा चारकोल दाल मखनी',
    description: 'Whole black lentils and kidney beans simmered overnight for 16 hours over glowing charcoal embers, finished with farm-churned white butter and aromatic kasuri methi.',
    category: 'Main Course',
    subcategory: 'Curries',
    price: 260,
    isVeg: true,
    isFeatured: true,
    isAvailable: true,
    portionSize: 'Serves 2 (450ml)',
    spiceLevel: 'Medium',
    preparationTimeMinutes: 12,
    allergens: ['Dairy'],
    imageUrl: '/public/assets/aistudio/WhatsApp_Image_2026-10-23_at_8.37.33_AM_822d0b5b.jpeg'
  },
  {
    id: 'dish-paneer-tikka',
    locationId: 'all',
    name: 'Shahi Paneer Tikka Angara',
    hindiName: 'शाही पनीर टिक्का अंगारा',
    description: 'Thick cubes of fresh malai paneer steeped in mustard oil, roasted gram flour, and crushed spices, char-grilled to perfection in clay tandoor with bell peppers.',
    category: 'Starters',
    subcategory: 'Tandoor',
    price: 290,
    isVeg: true,
    isFeatured: false,
    isAvailable: true,
    portionSize: '6 Large Pieces',
    spiceLevel: 'Medium',
    preparationTimeMinutes: 15,
    allergens: ['Dairy'],
    imageUrl: '/public/assets/aistudio/WhatsApp_Image_2026-10-23_at_8.37.33_AM_822d0b5b.jpeg'
  },
  {
    id: 'dish-butter-chicken',
    locationId: 'all',
    name: 'Dhaba Style Smokey Butter Chicken',
    hindiName: 'ढाबा बटर चिकन',
    description: 'Tandoor-roasted shredded chicken simmered in a velvety makhani gravy enriched with fresh cream, ripe Lucknow tomatoes, and home-made butter.',
    category: 'Main Course',
    subcategory: 'Curries',
    price: 380,
    isVeg: false,
    isFeatured: true,
    isAvailable: true,
    portionSize: 'Serves 2 (4 Pieces)',
    spiceLevel: 'Medium',
    preparationTimeMinutes: 16,
    allergens: ['Dairy', 'Nuts'],
    imageUrl: '/public/assets/aistudio/WhatsApp_Image_2026-10-23_at_8.37.33_AM_822d0b5b.jpeg'
  },
  {
    id: 'dish-garlic-butter-naan',
    locationId: 'all',
    name: 'Crispy Garlic Butter Tandoori Naan',
    hindiName: 'तंदूरी गार्लिक बटर नान',
    description: 'Refined wheat bread slapped against piping-hot clay tandoor walls, topped with roasted minced garlic, fresh coriander leaves and golden Amul butter.',
    category: 'Breads',
    subcategory: 'Tandoor Breads',
    price: 65,
    isVeg: true,
    isFeatured: false,
    isAvailable: true,
    portionSize: '1 Large Naan (cut in 2)',
    spiceLevel: 'Mild',
    preparationTimeMinutes: 8,
    allergens: ['Dairy', 'Gluten'],
    imageUrl: '/public/assets/aistudio/WhatsApp_Image_2026-10-23_at_8.37.33_AM_822d0b5b.jpeg'
  },
  {
    id: 'dish-shahi-tukda',
    locationId: 'shangrilla-hazratganj',
    name: 'Shahi Awadhi Tukda with Rabdi & Chandi Vark',
    hindiName: 'शाही टुकड़ा रबड़ी के साथ',
    description: 'Crisp ghee-fried milk bread soaked in saffron sugar syrup, blanketed with slow-reduced thick creamy rabdi, pistachios, silver leaf (vark) and cardamom.',
    category: 'Desserts',
    subcategory: 'Mithai',
    price: 180,
    isVeg: true,
    isFeatured: true,
    isAvailable: true,
    portionSize: '2 Portions with Rabdi',
    spiceLevel: 'Mild',
    preparationTimeMinutes: 10,
    allergens: ['Dairy', 'Gluten', 'Nuts'],
    imageUrl: '/public/assets/aistudio/WhatsApp_Image_2026-10-23_at_8.37.33_AM_822d0b5b.jpeg'
  },
  {
    id: 'dish-kulhad-chai',
    locationId: 'shangrilla-highway-dhaba',
    name: 'Highway Special Clay Kulhad Kadak Chai',
    hindiName: 'ढाबा स्पेशल कुल्हड़ चाय',
    description: 'Brewed over charcoal with whole buffalo milk, crushed ginger root, green cardamoms, and secret dhaba spices, poured steaming into rustic terracotta kulhads.',
    category: 'Beverages',
    subcategory: 'Hot Beverages',
    price: 40,
    isVeg: true,
    isFeatured: true,
    isAvailable: true,
    portionSize: '1 Terracotta Kulhad (180ml)',
    spiceLevel: 'Mild',
    preparationTimeMinutes: 6,
    allergens: ['Dairy'],
    imageUrl: '/public/assets/aistudio/WhatsApp_Image_2026-10-23_at_8.37.33_AM_822d0b5b.jpeg'
  }
];

const initialIngredients: Ingredient[] = [
  {
    id: 'ing-mutton-mince',
    name: 'Prime Mutton Keema (Finely Minced)',
    sku: 'ING-MUT-01',
    category: 'raw',
    unit: 'kg',
    currentStock: 24.5,
    reorderLevel: 8.0,
    safetyStock: 5.0,
    purchasePricePerUnit: 680,
    supplierId: 'sup-awadh-meats',
    locationId: 'shangrilla-hazratganj'
  },
  {
    id: 'ing-chicken',
    name: 'Fresh Farm Chicken Curry Cut',
    sku: 'ING-CHK-01',
    category: 'raw',
    unit: 'kg',
    currentStock: 42.0,
    reorderLevel: 15.0,
    safetyStock: 8.0,
    purchasePricePerUnit: 220,
    supplierId: 'sup-awadh-meats',
    locationId: 'all'
  },
  {
    id: 'ing-basmati-rice',
    name: 'Daawat 2-Year Aged Biryani Basmati Rice',
    sku: 'ING-RICE-01',
    category: 'raw',
    unit: 'kg',
    currentStock: 120.0,
    reorderLevel: 35.0,
    safetyStock: 20.0,
    purchasePricePerUnit: 145,
    supplierId: 'sup-lucknow-agro',
    locationId: 'all'
  },
  {
    id: 'ing-pure-ghee',
    name: 'Desi Cow Bilona Ghee',
    sku: 'ING-GHEE-01',
    category: 'dairy',
    unit: 'kg',
    currentStock: 38.0,
    reorderLevel: 10.0,
    safetyStock: 6.0,
    purchasePricePerUnit: 650,
    supplierId: 'sup-gomti-dairy',
    locationId: 'all'
  },
  {
    id: 'ing-malai-paneer',
    name: 'Fresh Malai Paneer Blocks',
    sku: 'ING-PAN-01',
    category: 'dairy',
    unit: 'kg',
    currentStock: 18.5,
    reorderLevel: 6.0,
    safetyStock: 4.0,
    purchasePricePerUnit: 340,
    supplierId: 'sup-gomti-dairy',
    locationId: 'all'
  },
  {
    id: 'ing-black-urad',
    name: 'Sabut Urad Dal (Black Lentils)',
    sku: 'ING-DAL-01',
    category: 'raw',
    unit: 'kg',
    currentStock: 50.0,
    reorderLevel: 15.0,
    safetyStock: 10.0,
    purchasePricePerUnit: 120,
    supplierId: 'sup-lucknow-agro',
    locationId: 'all'
  },
  {
    id: 'ing-clay-kulhad',
    name: 'Handcrafted Terracotta Chai Kulhads',
    sku: 'ING-KUL-01',
    category: 'packaging',
    unit: 'pcs',
    currentStock: 450,
    reorderLevel: 150,
    safetyStock: 100,
    purchasePricePerUnit: 3.5,
    supplierId: 'sup-chinhat-pottery',
    locationId: 'shangrilla-highway-dhaba'
  }
];

const initialRecipes: Recipe[] = [
  {
    id: 'rcp-galouti',
    menuItemId: 'dish-galouti-kebab',
    dishName: 'Galouti Kebab with Ulte Tawe Ka Paratha',
    yieldServings: 1,
    ingredients: [
      { ingredientId: 'ing-mutton-mince', ingredientName: 'Prime Mutton Keema', quantityRequired: 0.28, unit: 'kg' },
      { ingredientId: 'ing-pure-ghee', ingredientName: 'Desi Cow Bilona Ghee', quantityRequired: 0.05, unit: 'kg' }
    ],
    preparationNotes: 'Smoke mince with live clove and pure ghee for 15 minutes before shaping into patties.'
  },
  {
    id: 'rcp-biryani',
    menuItemId: 'dish-dum-biryani',
    dishName: 'Royal Lucknowi Awadhi Dum Biryani (Chicken)',
    yieldServings: 1,
    ingredients: [
      { ingredientId: 'ing-chicken', ingredientName: 'Fresh Farm Chicken', quantityRequired: 0.35, unit: 'kg' },
      { ingredientId: 'ing-basmati-rice', ingredientName: 'Aged Basmati Rice', quantityRequired: 0.25, unit: 'kg' },
      { ingredientId: 'ing-pure-ghee', ingredientName: 'Desi Cow Bilona Ghee', quantityRequired: 0.04, unit: 'kg' }
    ]
  },
  {
    id: 'rcp-dal-makhani',
    menuItemId: 'dish-dal-makhani-dhaba',
    dishName: 'Highway Dhaba Charcoal Dal Makhani',
    yieldServings: 1,
    ingredients: [
      { ingredientId: 'ing-black-urad', ingredientName: 'Sabut Urad Dal', quantityRequired: 0.18, unit: 'kg' },
      { ingredientId: 'ing-pure-ghee', ingredientName: 'Desi Cow Bilona Ghee', quantityRequired: 0.04, unit: 'kg' }
    ]
  }
];

const initialSuppliers: Supplier[] = [
  {
    id: 'sup-awadh-meats',
    name: 'Awadh Halal & Fresh Meats Co.',
    contactPerson: 'Mohammad Tariq',
    phone: '+91 94150 88219',
    email: 'tariq@awadhmeats.com',
    address: 'Chowk Mandi, Old Lucknow, UP',
    leadTimeDays: 1,
    suppliedItems: ['Prime Mutton Keema', 'Fresh Farm Chicken Curry Cut']
  },
  {
    id: 'sup-gomti-dairy',
    name: 'Gomti Valley Organic Dairy',
    contactPerson: 'Suresh Yadav',
    phone: '+91 98391 44520',
    email: 'supply@gomtidairy.in',
    address: 'Kisan Path, Sultanpur Road, Lucknow, UP',
    leadTimeDays: 1,
    suppliedItems: ['Desi Cow Bilona Ghee', 'Fresh Malai Paneer Blocks', 'Whole Buffalo Milk']
  },
  {
    id: 'sup-lucknow-agro',
    name: 'Lucknow Wholesale Agro Traders',
    contactPerson: 'Rajesh Agrawal',
    phone: '+91 522 225 9011',
    email: 'orders@lucknowagro.com',
    address: 'Daliganj Grain Market, Lucknow, UP',
    leadTimeDays: 2,
    suppliedItems: ['Daawat Aged Biryani Basmati Rice', 'Sabut Urad Dal', 'Premium Spices']
  },
  {
    id: 'sup-chinhat-pottery',
    name: 'Chinhat Traditional Terracotta Works',
    contactPerson: 'Rameshwar Prajapati',
    phone: '+91 97940 33812',
    email: 'chinhat.pottery@gmail.com',
    address: 'Industrial Area, Chinhat, Lucknow, UP',
    leadTimeDays: 3,
    suppliedItems: ['Handcrafted Terracotta Chai Kulhads', 'Biryani Clay Handis']
  }
];

const initialCoupons: Coupon[] = [
  {
    code: 'LUCKNOWFIRST',
    discountType: 'PERCENT',
    discountValue: 15,
    minOrderValue: 400,
    maxDiscount: 150,
    validUntil: '2027-12-31',
    usageLimit: 1000,
    timesUsed: 42,
    isActive: true
  },
  {
    code: 'ROYAL100',
    discountType: 'FLAT',
    discountValue: 100,
    minOrderValue: 700,
    maxDiscount: 100,
    validUntil: '2027-12-31',
    usageLimit: 500,
    timesUsed: 89,
    isActive: true
  },
  {
    code: 'DHABAPASS',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderValue: 250,
    maxDiscount: 80,
    validUntil: '2027-12-31',
    usageLimit: 1000,
    timesUsed: 64,
    isActive: true
  }
];

const initialWebsiteConfig: WebsiteConfig = {
  heroTitle: 'Savour the Royal Heritage of Lucknow',
  heroSubtitle: 'Handcrafted Awadhi Dastarkhwan & Highway Dhaba Charcoal Flavours, cooked fresh with generations of secret spices.',
  storyHeading: 'A Tale of Two Culinary Traditions in the City of Nawabs',
  storyParagraph: 'SHANGRILLA was born from an unshakeable reverence for Lucknow’s gastronomy. In the royal lanes of Hazratganj, our master Bawarchis preserve slow-dum Awadhi traditions of melting Galouti and saffron biryani. Along the Faizabad highway, our lively open-air Dhaba celebrates iron kadhais, charcoal tandoors, and bubbling handis for travelers and food lovers alike.',
  announcementBanner: '✨ Celebrate the Flavours of Awadh: Enjoy 15% off with coupon code LUCKNOWFIRST on your first digital order!',
  showBanner: true,
  contactPhone: '+91 522 261 4892 / +91 98390 12899',
  contactEmail: 'contact@shangrilla-lucknow.com',
  restaurantHours: '12:00 PM – 11:30 PM (Hazratganj)',
  dhabaHours: '24 Hours Open (Highway Dhaba)',
  featuredCategory: 'Awadhi Specials',
  galleryImages: [
    '/public/assets/aistudio/WhatsApp_Image_2026-10-23_at_8.37.33_AM_822d0b5b.jpeg',
    '/public/assets/aistudio/WhatsApp_Image_2026-10-23_at_8.37.34_AM__1__2200bfab.jpeg'
  ],
  tvPlaylist: [
    {
      id: 'pl-1',
      title: 'Galouti Kebab Chef Special',
      type: 'ANNOUNCEMENT',
      url: 'Order Ready? Please keep your digital bill screenshot ready at the collection counter!',
      durationSeconds: 15,
      active: true
    },
    {
      id: 'pl-2',
      title: 'Highway Dhaba Fresh Kulhad Chai',
      type: 'ANNOUNCEMENT',
      url: 'Fresh piping hot Masala Chai brewed every 15 minutes in authentic terracotta kulhads.',
      durationSeconds: 15,
      active: true
    }
  ]
};

// Seed an initial live order so kitchen and cashier have immediately testable orders out of the box!
const initialOrders: Order[] = [
  {
    id: 'ord-seed-001',
    displayNumber: '021',
    cycleId: getCurrent48HourCycleId(),
    locationId: 'shangrilla-hazratganj',
    locationName: 'SHANGRILLA Royal Restaurant',
    orderType: 'DINE_IN',
    tableNumber: 'Table 4',
    customerName: 'Adil Tabassum',
    customerPhone: '+91 98390 12345',
    customerNotes: 'Please ensure Galouti kebabs are served hot with extra mint chutney.',
    items: [
      {
        menuItemId: 'dish-galouti-kebab',
        name: 'Galouti Kebab with Ulte Tawe Ka Paratha',
        price: 360,
        quantity: 1,
        selectedAddons: [{ name: 'Extra Ulte Tawe Ka Paratha (1 Pc)', price: 45 }],
        totalPrice: 405
      },
      {
        menuItemId: 'dish-dum-biryani',
        name: 'Royal Lucknowi Awadhi Dum Biryani (Chicken)',
        price: 390,
        quantity: 1,
        selectedAddons: [{ name: 'Burhani Garlic Raita (Recommended)', price: 40 }],
        totalPrice: 430
      }
    ],
    subtotal: 835,
    discount: 100,
    couponCode: 'ROYAL100',
    cgst: 18.38,
    sgst: 18.38,
    total: 771.76,
    kitchenStatus: 'PREPARING',
    paymentStatus: 'PAID',
    paymentMethod: 'UPI_QR',
    paymentReference: 'UPI-REF-987452109',
    paidAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    paidVerifiedBy: 'Manager Tariq',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    statusHistory: [
      { status: 'RECEIVED', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), changedBy: 'System' },
      { status: 'ACCEPTED', timestamp: new Date(Date.now() - 13 * 60 * 1000).toISOString(), changedBy: 'Kitchen Chef' },
      { status: 'PREPARING', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), changedBy: 'Kitchen Chef' }
    ]
  },
  {
    id: 'ord-seed-002',
    displayNumber: '022',
    cycleId: getCurrent48HourCycleId(),
    locationId: 'shangrilla-highway-dhaba',
    locationName: 'SHANGRILLA Highway Express Dhaba',
    orderType: 'TAKEAWAY',
    customerName: 'Vikram Singh',
    customerPhone: '+91 94150 99881',
    customerNotes: 'Traveling to Ayodhya, please pack tightly for highway travel.',
    items: [
      {
        menuItemId: 'dish-dal-makhani-dhaba',
        name: 'Highway Dhaba Charcoal Dal Makhani',
        price: 260,
        quantity: 2,
        totalPrice: 520
      },
      {
        menuItemId: 'dish-garlic-butter-naan',
        name: 'Crispy Garlic Butter Tandoori Naan',
        price: 65,
        quantity: 4,
        totalPrice: 260
      },
      {
        menuItemId: 'dish-kulhad-chai',
        name: 'Highway Special Clay Kulhad Kadak Chai',
        price: 40,
        quantity: 2,
        totalPrice: 80
      }
    ],
    subtotal: 860,
    discount: 0,
    cgst: 21.5,
    sgst: 21.5,
    total: 903,
    kitchenStatus: 'READY',
    paymentStatus: 'PENDING',
    paymentMethod: 'CASH_AT_COUNTER',
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    statusHistory: [
      { status: 'RECEIVED', timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(), changedBy: 'System' },
      { status: 'ACCEPTED', timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(), changedBy: 'Dhaba Kitchen' },
      { status: 'PREPARING', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), changedBy: 'Dhaba Kitchen' },
      { status: 'READY', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), changedBy: 'Dhaba Kitchen' }
    ]
  }
];

const initialLoyaltySettings: LoyaltySettings = {
  earnRatePercent: 5,
  redemptionValuePerPoint: 0.5,
  minPointsToRedeem: 50,
  maxRedeemPercent: 50,
  pointsExpiryDays: 365,
  tiers: [
    {
      name: 'BRONZE',
      label: 'Bronze Member',
      minSpent: 0,
      multiplier: 1.0,
      perks: ['5% points earning', 'Free Gulab Jamun on birthday', 'Digital bill access']
    },
    {
      name: 'SILVER',
      label: 'Silver Nawabi',
      minSpent: 2500,
      multiplier: 1.25,
      perks: ['6.25% points earning', 'Priority dine-in seating', 'Complimentary Shahi Kulhad Chai']
    },
    {
      name: 'GOLD',
      label: 'Gold Dastarkhwan',
      minSpent: 7500,
      multiplier: 1.5,
      perks: ['7.5% points earning', 'Dedicated table reservation', 'Special chef tasting kebab on arrival', '10% off banquets']
    },
    {
      name: 'SHAHI_ROYAL',
      label: 'Shahi Royal VIP',
      minSpent: 20000,
      multiplier: 2.0,
      perks: ['10% points earning', 'VIP Banquet booking concierge', 'Complimentary Ulte Tawe Parathas on every visit', 'Private dining room access']
    }
  ]
};

const initialEventBookings: EventBooking[] = [
  {
    id: 'evt-2026-001',
    bookingReference: 'EVT-LKO-001',
    eventType: 'Awadhi Dastarkhwan Family Feast',
    headcount: 45,
    date: '2026-11-12',
    timeSlot: 'DINNER',
    preferredLocationId: 'shangrilla-hazratganj',
    preferredHallOrArea: 'Royal Darbar Hall',
    customerName: 'Nawabzada Zafar Ali Khan',
    customerPhone: '+91 98390 44556',
    customerEmail: 'zafar.khan@lucknowheritage.in',
    packagePreference: 'Royal Awadhi Platinum',
    estimatedBudgetPerHead: 1450,
    totalEstimatedAmount: 65250,
    advanceDepositPaid: 20000,
    status: 'CONFIRMED',
    specialRequests: 'Traditional seated silver dastarkhwan setup, live ghazal background, extra Galouti kebabs and Shahi Tukda.',
    internalNotes: 'Confirmed by Banquet Manager Tariq. Advance ₹20,000 received via ICICI UPI.',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'evt-2026-002',
    bookingReference: 'EVT-LKO-002',
    eventType: 'Birthday Celebration',
    headcount: 70,
    date: '2026-11-18',
    timeSlot: 'DINNER',
    preferredLocationId: 'shangrilla-highway-dhaba',
    preferredHallOrArea: 'Highway Open Lawn & VIP Pavilions',
    customerName: 'Priya Srivastava',
    customerPhone: '+91 94150 77889',
    customerEmail: 'priya.sri@gmail.com',
    packagePreference: 'Highway Tandoor BBQ Buffet',
    estimatedBudgetPerHead: 850,
    totalEstimatedAmount: 59500,
    advanceDepositPaid: 10000,
    status: 'PENDING',
    specialRequests: 'Open-air charcoal tandoor live counters, fairy lights across highway lawn, projector screen for birthday montage.',
    internalNotes: 'Customer requested follow-up call regarding dessert selection (Kheer vs Kulfi).',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  }
];

export const initialTableBookings: TableBooking[] = [
  {
    id: 'tbl-book-101',
    bookingRef: 'TBL-2026-101',
    customerName: 'Adil Tabassum',
    customerPhone: '+91 98390 12345',
    customerEmail: 'adil.tabassum@gmail.com',
    locationId: 'shangrilla-hazratganj',
    locationName: 'Shangrilla Fine Dining Restaurant & Darbar Hall (Hazratganj)',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '19:30',
    guestCount: 4,
    seatingArea: 'AC Royal Darbar Hall',
    specialRequests: 'Window side table, celebrating family dinner with Awadhi Dum Biryani.',
    status: 'CONFIRMED',
    tableAssigned: 'T-04',
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  },
  {
    id: 'tbl-book-102',
    bookingRef: 'TBL-2026-102',
    customerName: 'Vikram Singh Chauhan',
    customerPhone: '+91 94150 88214',
    customerEmail: 'vikram.singh@outlook.com',
    locationId: 'shangrilla-highway-dhaba',
    locationName: 'Shangrilla 24/7 Highway Express Dhaba & Grand Lawns (NH-27)',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '21:00',
    guestCount: 6,
    seatingArea: 'Highway Charpai Lawn Under the Stars',
    specialRequests: 'Traditional charpai near live tandoor, extra kulhad chai after meal.',
    status: 'CONFIRMED',
    tableAssigned: 'CH-08',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  }
];

class DatabaseStore {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.feedbacks) parsed.feedbacks = [];
        if (!parsed.eventBookings) parsed.eventBookings = initialEventBookings;
        if (!parsed.tableBookings) parsed.tableBookings = initialTableBookings;
        if (!parsed.loyaltySettings) parsed.loyaltySettings = initialLoyaltySettings;
        if (!parsed.loyaltyAccounts) parsed.loyaltyAccounts = [];
        
        // Ensure every loyalty account has a tier assigned
        parsed.loyaltyAccounts = parsed.loyaltyAccounts.map((acc: any) => {
          if (!acc.tier) {
            acc.tier = acc.totalSpent >= 20000 ? 'SHAHI_ROYAL' : acc.totalSpent >= 7500 ? 'GOLD' : acc.totalSpent >= 2500 ? 'SILVER' : 'BRONZE';
          }
          return acc;
        });

        return parsed;
      }
    } catch (err) {
      console.error('[DB] Error loading database file, initializing defaults:', err);
    }

    const currentCycle = getCurrent48HourCycleId();
    const defaults: DatabaseSchema = {
      locations: initialLocations,
      menuItems: initialMenuItems,
      orders: initialOrders,
      orderCounters: {
        'shangrilla-hazratganj': { cycleId: currentCycle, counter: 21 },
        'shangrilla-highway-dhaba': { cycleId: currentCycle, counter: 22 }
      },
      ingredients: initialIngredients,
      recipes: initialRecipes,
      stockMovements: [
        {
          id: 'sm-init-1',
          ingredientId: 'ing-mutton-mince',
          ingredientName: 'Prime Mutton Keema',
          locationId: 'shangrilla-hazratganj',
          type: 'OPENING',
          quantity: 25,
          balanceAfter: 25,
          reason: 'Initial physical stock verification',
          performedBy: 'System Seed',
          timestamp: new Date().toISOString()
        }
      ],
      suppliers: initialSuppliers,
      purchaseOrders: [
        {
          id: 'po-101',
          poNumber: 'PO-LKO-2026-001',
          supplierId: 'sup-awadh-meats',
          supplierName: 'Awadh Halal & Fresh Meats Co.',
          locationId: 'shangrilla-hazratganj',
          status: 'APPROVED',
          items: [
            {
              ingredientId: 'ing-mutton-mince',
              ingredientName: 'Prime Mutton Keema',
              quantityOrdered: 15,
              unitPrice: 680
            }
          ],
          totalAmount: 10200,
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          expectedDeliveryDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
        }
      ],
      expenses: [
        {
          id: 'exp-1',
          locationId: 'shangrilla-hazratganj',
          category: 'ELECTRICITY',
          title: 'Hazratganj LESA Commercial Power Bill',
          amount: 28400,
          paidDate: '2026-10-15',
          paidTo: 'Madhyanchal Vidyut Vitaran Nigam',
          notes: 'Air conditioning & cold storage'
        },
        {
          id: 'exp-2',
          locationId: 'shangrilla-highway-dhaba',
          category: 'SUPPLIES',
          title: 'Charcoal Embers & Dhaba Clay Tandoor Fuel',
          amount: 8500,
          paidDate: '2026-10-18',
          paidTo: 'Awadh Coal Depot',
          notes: 'Monthly tandoor hardwood charcoal supply'
        }
      ],
      coupons: initialCoupons,
      loyaltyAccounts: [
        {
          phone: '+91 98390 12345',
          customerName: 'Adil Tabassum',
          points: 120,
          totalOrdersCount: 4,
          totalSpent: 3450,
          tier: 'SILVER',
          history: [
            {
              orderId: 'ord-seed-001',
              pointsChange: 38,
              reason: '5% loyalty points on Order #021',
              timestamp: new Date().toISOString()
            }
          ]
        }
      ],
      loyaltySettings: initialLoyaltySettings,
      eventBookings: initialEventBookings,
      tableBookings: initialTableBookings,
      websiteConfig: initialWebsiteConfig,
      auditLogs: [
        {
          id: 'aud-init-1',
          action: 'SYSTEM_BOOT',
          entityType: 'SETTINGS',
          entityId: 'global',
          changedBy: 'System',
          details: 'Initialized SHANGRILLA dual-location platform with 48h short counter cycle',
          timestamp: new Date().toISOString()
        }
      ],
      feedbacks: [
        {
          id: 'fb-101',
          orderId: 'ord-seed-001',
          displayNumber: '021',
          customerName: 'Adil Tabassum',
          customerPhone: '+91 98390 12345',
          overallRating: 5,
          foodQualityRating: 5,
          serviceRating: 5,
          dishReviews: [
            {
              menuItemId: 'dish-galouti-kebab',
              dishName: 'Galouti Kebab with Ulte Tawe Ka Paratha',
              rating: 5,
              comment: 'Incredible melt-in-mouth texture, smoked to absolute perfection with cloves!'
            },
            {
              menuItemId: 'dish-dum-biryani',
              dishName: 'Royal Lucknowi Awadhi Dum Biryani (Chicken)',
              rating: 5,
              comment: 'Subtle saffron fragrance and tender chicken, true Nawabi dastarkhwan style.'
            }
          ],
          comment: 'Outstanding fine dining experience in Hazratganj! The digital bill and prompt live order tracking made our visit seamless.',
          locationId: 'shangrilla-hazratganj',
          createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
        }
      ]
    };

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(defaults, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Failed to write initial db file:', e);
    }
    return defaults;
  }

  public save(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (err) {
        console.error('[DB] Failed to persist database:', err);
      }
    }, 100);
  }

  public get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    return this.data[key];
  }

  public set<K extends keyof DatabaseSchema>(key: K, value: DatabaseSchema[K]): void {
    this.data[key] = value;
    this.save();
  }

  public getRaw(): DatabaseSchema {
    return this.data;
  }

  public restore(imported: DatabaseSchema): void {
    this.data = imported;
    this.save();
  }
}

export const db = new DatabaseStore();
