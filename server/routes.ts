import { Router, Request, Response } from 'express';
import { db } from './db';
import { OrderService } from './orderService';
import { Order, KitchenStatus, PaymentStatus, StockMovement, MenuItem, EventBooking, EventStatus, TableBooking, TableBookingStatus, LoyaltyAccount, LoyaltySettings, MemberProfile } from '../src/types/models';

export const apiRouter = Router();

// Store active SSE client response objects
const sseClients: Response[] = [];

export function broadcastSSE(type: string, data: any): void {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].write(payload);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

// ----------------------------------------------------
// Real-time Server-Sent Events (SSE) Stream
// ----------------------------------------------------
apiRouter.get('/realtime/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) {
      sseClients.splice(idx, 1);
    }
  });
});

// ----------------------------------------------------
// Locations
// ----------------------------------------------------
apiRouter.get('/locations', (req: Request, res: Response) => {
  const locations = db.get('locations');
  res.json({ success: true, data: locations });
});

// ----------------------------------------------------
// Menu Management
// ----------------------------------------------------
apiRouter.get('/menu', (req: Request, res: Response) => {
  const { locationId } = req.query;
  let items = db.get('menuItems');
  if (locationId && locationId !== 'all') {
    items = items.filter(i => i.locationId === 'all' || i.locationId === locationId);
  }
  res.json({ success: true, data: items });
});

apiRouter.post('/menu', (req: Request, res: Response) => {
  const rawItem = req.body as Partial<MenuItem>;
  if (!rawItem.name || !rawItem.price || !rawItem.category) {
    return res.status(400).json({ success: false, error: 'Name, price and category are required' });
  }

  const items = db.get('menuItems');
  const newItem: MenuItem = {
    id: `dish-${Date.now()}`,
    locationId: rawItem.locationId || 'all',
    name: rawItem.name,
    hindiName: rawItem.hindiName,
    description: rawItem.description || '',
    category: rawItem.category,
    subcategory: rawItem.subcategory,
    price: Number(rawItem.price),
    discountedPrice: rawItem.discountedPrice ? Number(rawItem.discountedPrice) : undefined,
    isVeg: Boolean(rawItem.isVeg),
    isFeatured: Boolean(rawItem.isFeatured),
    isAvailable: rawItem.isAvailable !== false,
    portionSize: rawItem.portionSize || '1 Portion',
    spiceLevel: rawItem.spiceLevel || 'Medium',
    preparationTimeMinutes: Number(rawItem.preparationTimeMinutes) || 15,
    allergens: rawItem.allergens || [],
    imageUrl: rawItem.imageUrl || '/public/assets/aistudio/WhatsApp_Image_2026-10-23_at_8.37.33_AM_822d0b5b.jpeg',
    customizationGroups: rawItem.customizationGroups || []
  };

  items.unshift(newItem);
  db.set('menuItems', [...items]);

  // Log audit
  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `aud-${Date.now()}`,
    action: 'CREATE_MENU_ITEM',
    entityType: 'MENU',
    entityId: newItem.id,
    changedBy: req.body.operator || 'Admin',
    details: `Added new dish "${newItem.name}" (₹${newItem.price})`,
    timestamp: new Date().toISOString()
  });
  db.set('auditLogs', auditLogs);

  broadcastSSE('menu_updated', newItem);
  res.status(201).json({ success: true, data: newItem });
});

apiRouter.put('/menu/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const items = db.get('menuItems');
  const index = items.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Dish not found' });
  }

  items[index] = { ...items[index], ...req.body, id };
  db.set('menuItems', [...items]);

  broadcastSSE('menu_updated', items[index]);
  res.json({ success: true, data: items[index] });
});

apiRouter.delete('/menu/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let items = db.get('menuItems');
  const found = items.find(i => i.id === id);
  if (!found) {
    return res.status(404).json({ success: false, error: 'Dish not found' });
  }

  items = items.filter(i => i.id !== id);
  db.set('menuItems', items);

  broadcastSSE('menu_updated', { id, deleted: true });
  res.json({ success: true, message: 'Dish removed successfully' });
});

// ----------------------------------------------------
// Orders & Customer Ordering
// ----------------------------------------------------
apiRouter.get('/orders', (req: Request, res: Response) => {
  const { locationId, status, paymentStatus, search } = req.query;
  let orders = db.get('orders');

  if (locationId && locationId !== 'all') {
    orders = orders.filter(o => o.locationId === locationId);
  }
  if (status) {
    orders = orders.filter(o => o.kitchenStatus === status);
  }
  if (paymentStatus) {
    orders = orders.filter(o => o.paymentStatus === paymentStatus);
  }
  if (search) {
    const q = String(search).toLowerCase();
    orders = orders.filter(o =>
      o.displayNumber.includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      (o.tableNumber && o.tableNumber.toLowerCase().includes(q))
    );
  }

  // Sort newest first
  orders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, data: orders });
});

// ----------------------------------------------------
// Order History Search by Phone (placed before :id route)
// ----------------------------------------------------
apiRouter.get('/orders/history', (req: Request, res: Response) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required.' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const orders = db.get('orders');
  const feedbacks = db.get('feedbacks') || [];

  const matched = orders.filter(o => {
    const oPhone = (o.customerPhone || '').replace(/\D/g, '');
    return oPhone && (oPhone.includes(cleanPhone) || cleanPhone.includes(oPhone));
  });

  // Attach hasFeedback boolean
  const result = matched.map(o => ({
    ...o,
    hasFeedback: feedbacks.some(f => f.orderId === o.id)
  }));

  // Sort newest first
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, data: result });
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const orders = db.get('orders');
  const order = orders.find(o => o.id === id || o.displayNumber === id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  res.json({ success: true, data: order });
});

apiRouter.post('/orders', (req: Request, res: Response) => {
  try {
    const {
      locationId,
      orderType,
      tableNumber,
      customerName,
      customerPhone,
      customerNotes,
      items: rawItems,
      couponCode,
      pointsToRedeem,
      paymentMethod
    } = req.body;

    if (!locationId || !orderType || !rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required order parameters' });
    }

    const locations = db.get('locations');
    const location = locations.find(l => l.id === locationId);
    if (!location) {
      return res.status(400).json({ success: false, error: 'Invalid location ID' });
    }

    // Authoritative price, coupon, and points discount calculation
    const calculated = OrderService.calculateOrderTotals(
      locationId,
      rawItems,
      couponCode,
      pointsToRedeem ? Number(pointsToRedeem) : undefined,
      customerPhone
    );

    // Generate atomic 48-hour cycle short order number
    const { displayNumber, cycleId } = OrderService.getNextDisplayNumber(locationId);

    const now = new Date().toISOString();
    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      displayNumber,
      cycleId,
      locationId,
      locationName: location.name,
      orderType,
      tableNumber: orderType === 'DINE_IN' ? (tableNumber || 'Table 1') : undefined,
      customerName: customerName?.trim() || 'Valued Guest',
      customerPhone: customerPhone?.trim() || '',
      customerNotes: customerNotes?.trim() || undefined,
      items: calculated.verifiedItems,
      subtotal: calculated.subtotal,
      discount: calculated.discount,
      couponCode: calculated.couponCode,
      pointsRedeemed: calculated.pointsRedeemed,
      pointsDiscount: calculated.pointsDiscount,
      cgst: calculated.cgst,
      sgst: calculated.sgst,
      total: calculated.total,
      kitchenStatus: 'RECEIVED',
      paymentStatus: 'PENDING',
      paymentMethod: paymentMethod || 'CASH_AT_COUNTER',
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        { status: 'RECEIVED', timestamp: now, changedBy: 'Customer (Online/QR)' }
      ]
    };

    const orders = db.get('orders');
    orders.unshift(newOrder);
    db.set('orders', [...orders]);

    // Audit log
    const auditLogs = db.get('auditLogs');
    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      action: 'ORDER_PLACED',
      entityType: 'ORDER',
      entityId: newOrder.id,
      changedBy: newOrder.customerName,
      details: `Order #${newOrder.displayNumber} placed (${newOrder.orderType}, Total: ₹${newOrder.total})`,
      timestamp: now
    });
    db.set('auditLogs', auditLogs);

    // Broadcast SSE to kitchen, cashier, and collection TV
    broadcastSSE('new_order', newOrder);

    res.status(201).json({ success: true, data: newOrder });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to place order' });
  }
});

apiRouter.patch('/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, operator, note } = req.body;
  const allowedStatuses: KitchenStatus[] = ['RECEIVED', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED', 'CANCELLED'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid kitchen status' });
  }

  const orders = db.get('orders');
  const order = orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const now = new Date().toISOString();

  // If customer is cancelling, check 3-minute window
  if (status === 'CANCELLED') {
    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    if (operator === 'Customer' && elapsedMs > 3 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        error: 'Order cancellation window (3 minutes) has passed. Please speak directly with the kitchen staff.'
      });
    }
  }

  // If moving into PREPARING for the first time, consume recipe ingredients
  if (status === 'PREPARING' && order.kitchenStatus !== 'PREPARING') {
    OrderService.consumeIngredientsForOrder(order, operator || 'Kitchen Chef');
  }

  if (status === 'READY') {
    order.readyAt = now;
  } else if (status === 'COLLECTED') {
    order.collectedAt = now;
  }

  order.kitchenStatus = status;
  order.updatedAt = now;
  order.statusHistory.push({
    status,
    timestamp: now,
    changedBy: operator || 'Kitchen Staff',
    note
  });

  db.set('orders', [...orders]);

  // Broadcast real-time update
  broadcastSSE('order_status_updated', {
    orderId: order.id,
    displayNumber: order.displayNumber,
    kitchenStatus: order.kitchenStatus,
    updatedAt: order.updatedAt,
    readyAt: order.readyAt,
    collectedAt: order.collectedAt
  });

  res.json({ success: true, data: order });
});

apiRouter.patch('/orders/:id/payment', (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentStatus, paymentMethod, paymentReference, operator } = req.body;

  const orders = db.get('orders');
  const order = orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  if (order.paymentStatus === 'PAID' && paymentStatus === 'PAID') {
    return res.status(400).json({ success: false, error: 'Payment is already confirmed for this order.' });
  }

  const now = new Date().toISOString();
  order.paymentStatus = paymentStatus as PaymentStatus;
  if (paymentMethod) order.paymentMethod = paymentMethod;
  if (paymentReference) order.paymentReference = paymentReference;

  if (paymentStatus === 'PAID') {
    order.paidAt = now;
    order.paidVerifiedBy = operator || 'Cashier Desk';

    // Award loyalty points
    OrderService.awardLoyaltyPoints(order);
  }

  order.updatedAt = now;
  db.set('orders', [...orders]);

  // Audit log
  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `aud-${Date.now()}`,
    action: 'PAYMENT_CONFIRMED',
    entityType: 'PAYMENT',
    entityId: order.id,
    changedBy: operator || 'Cashier',
    details: `Order #${order.displayNumber} marked ${paymentStatus} (${order.paymentMethod}, Ref: ${paymentReference || 'N/A'})`,
    timestamp: now
  });
  db.set('auditLogs', auditLogs);

  broadcastSSE('payment_updated', {
    orderId: order.id,
    displayNumber: order.displayNumber,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    paidAt: order.paidAt
  });

  res.json({ success: true, data: order });
});

// Customer 3-minute modification
apiRouter.patch('/orders/:id/modify', (req: Request, res: Response) => {
  const { id } = req.params;
  const { customerNotes } = req.body;

  const orders = db.get('orders');
  const order = orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
  if (elapsedMs > 3 * 60 * 1000) {
    return res.status(400).json({
      success: false,
      error: 'The 3-minute modification window has expired.'
    });
  }

  if (order.kitchenStatus !== 'RECEIVED') {
    return res.status(400).json({
      success: false,
      error: `Order has already been ${order.kitchenStatus.toLowerCase()} by the kitchen and cannot be modified online.`
    });
  }

  order.customerNotes = customerNotes?.trim();
  order.updatedAt = new Date().toISOString();
  db.set('orders', [...orders]);

  broadcastSSE('order_modified', { orderId: order.id, customerNotes: order.customerNotes });
  res.json({ success: true, data: order });
});

// ----------------------------------------------------
// Customer Collection TV Queue
// ----------------------------------------------------
apiRouter.get('/tv/ready-orders', (req: Request, res: Response) => {
  const { locationId } = req.query;
  const orders = db.get('orders');
  
  // Show READY orders; exclude COLLECTED and CANCELLED
  let readyOrders = orders.filter(o => o.kitchenStatus === 'READY');
  if (locationId && locationId !== 'all') {
    readyOrders = readyOrders.filter(o => o.locationId === locationId);
  }

  // Also include currently PREPARING orders for split TV display ("Now Preparing" vs "Ready to Collect")
  let preparingOrders = orders.filter(o => o.kitchenStatus === 'PREPARING' || o.kitchenStatus === 'ACCEPTED');
  if (locationId && locationId !== 'all') {
    preparingOrders = preparingOrders.filter(o => o.locationId === locationId);
  }

  res.json({
    success: true,
    data: {
      ready: readyOrders.map(o => ({
        id: o.id,
        displayNumber: o.displayNumber,
        locationId: o.locationId,
        orderType: o.orderType,
        tableNumber: o.tableNumber,
        readyAt: o.readyAt
      })),
      preparing: preparingOrders.map(o => ({
        id: o.id,
        displayNumber: o.displayNumber,
        locationId: o.locationId,
        orderType: o.orderType
      }))
    }
  });
});

// ----------------------------------------------------
// Inventory & Stock Forecasting
// ----------------------------------------------------
apiRouter.get('/inventory', (req: Request, res: Response) => {
  const ingredients = db.get('ingredients');
  const movements = db.get('stockMovements');
  res.json({ success: true, data: { ingredients, movements: movements.slice(0, 50) } });
});

apiRouter.post('/inventory/movement', (req: Request, res: Response) => {
  const { ingredientId, locationId, type, quantity, reason, operator } = req.body;
  const ingredients = db.get('ingredients');
  const movements = db.get('stockMovements');

  const ingredient = ingredients.find(i => i.id === ingredientId);
  if (!ingredient) {
    return res.status(404).json({ success: false, error: 'Ingredient not found' });
  }

  const qty = Number(quantity);
  ingredient.currentStock = Math.max(0, Math.round((ingredient.currentStock + qty) * 1000) / 1000);

  const newMovement: StockMovement = {
    id: `sm-${Date.now()}`,
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    locationId: locationId || 'shangrilla-hazratganj',
    type: type || 'ADJUSTMENT',
    quantity: qty,
    balanceAfter: ingredient.currentStock,
    reason: reason || 'Manual stock update',
    performedBy: operator || 'Manager',
    timestamp: new Date().toISOString()
  };

  movements.unshift(newMovement);
  db.set('ingredients', [...ingredients]);
  db.set('stockMovements', movements.slice(0, 500));

  res.json({ success: true, data: { ingredient, movement: newMovement } });
});

apiRouter.get('/inventory/forecast', (req: Request, res: Response) => {
  const ingredients = db.get('ingredients');
  const movements = db.get('stockMovements');

  // Estimate daily consumption from recent 7 days ORDER_CONSUMPTION movements
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;
  const consumptionByItem: Record<string, number> = {};

  for (const m of movements) {
    if (m.type === 'ORDER_CONSUMPTION' && new Date(m.timestamp).getTime() >= sevenDaysAgo) {
      consumptionByItem[m.ingredientId] = (consumptionByItem[m.ingredientId] || 0) + Math.abs(m.quantity);
    }
  }

  const forecast = ingredients.map(ing => {
    // 7-day average or default baseline rate
    const consumedPastWeek = consumptionByItem[ing.id] || (ing.reorderLevel * 0.4);
    const avgDailyConsumption = Math.max(0.1, Math.round((consumedPastWeek / 7) * 100) / 100);
    const daysRemaining = Math.round((ing.currentStock / avgDailyConsumption) * 10) / 10;
    const isLowStock = ing.currentStock <= ing.reorderLevel;
    const isCritical = ing.currentStock <= ing.safetyStock;
    const suggestedPurchaseQty = isLowStock
      ? Math.round((ing.reorderLevel * 2 - ing.currentStock) * 10) / 10
      : 0;

    return {
      ingredientId: ing.id,
      name: ing.name,
      sku: ing.sku,
      unit: ing.unit,
      currentStock: ing.currentStock,
      reorderLevel: ing.reorderLevel,
      safetyStock: ing.safetyStock,
      avgDailyConsumption,
      daysRemaining,
      isLowStock,
      isCritical,
      suggestedPurchaseQty
    };
  });

  res.json({ success: true, data: forecast });
});

// ----------------------------------------------------
// Recipes & Suppliers & Purchase Orders
// ----------------------------------------------------
apiRouter.get('/recipes', (req: Request, res: Response) => {
  const recipes = db.get('recipes');
  res.json({ success: true, data: recipes });
});

apiRouter.get('/suppliers', (req: Request, res: Response) => {
  const suppliers = db.get('suppliers');
  res.json({ success: true, data: suppliers });
});

apiRouter.get('/purchase-orders', (req: Request, res: Response) => {
  const pos = db.get('purchaseOrders');
  res.json({ success: true, data: pos });
});

apiRouter.post('/purchase-orders', (req: Request, res: Response) => {
  const { supplierId, locationId, items } = req.body;
  const suppliers = db.get('suppliers');
  const pos = db.get('purchaseOrders');

  const supplier = suppliers.find(s => s.id === supplierId);
  if (!supplier) {
    return res.status(404).json({ success: false, error: 'Supplier not found' });
  }

  let totalAmount = 0;
  for (const it of items) {
    totalAmount += it.quantityOrdered * it.unitPrice;
  }

  const newPO = {
    id: `po-${Date.now()}`,
    poNumber: `PO-LKO-${Date.now().toString().slice(-4)}`,
    supplierId: supplier.id,
    supplierName: supplier.name,
    locationId: locationId || 'shangrilla-hazratganj',
    status: 'DRAFT' as const,
    items,
    totalAmount,
    createdAt: new Date().toISOString(),
    expectedDeliveryDate: new Date(Date.now() + supplier.leadTimeDays * 24 * 3600 * 1000).toISOString()
  };

  pos.unshift(newPO);
  db.set('purchaseOrders', [...pos]);
  res.status(201).json({ success: true, data: newPO });
});

apiRouter.patch('/purchase-orders/:id/receive', (req: Request, res: Response) => {
  const { id } = req.params;
  const { invoiceReference, operator } = req.body;
  const pos = db.get('purchaseOrders');
  const ingredients = db.get('ingredients');
  const movements = db.get('stockMovements');

  const po = pos.find(p => p.id === id);
  if (!po) {
    return res.status(404).json({ success: false, error: 'PO not found' });
  }

  po.status = 'RECEIVED';
  po.receivedAt = new Date().toISOString();
  po.invoiceReference = invoiceReference || `INV-${Date.now()}`;

  // Increment stock for each item in PO
  for (const item of po.items) {
    const ing = ingredients.find(i => i.id === item.ingredientId);
    if (ing) {
      ing.currentStock += item.quantityOrdered;
      movements.unshift({
        id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ingredientId: ing.id,
        ingredientName: ing.name,
        locationId: po.locationId,
        type: 'PURCHASE',
        quantity: item.quantityOrdered,
        balanceAfter: ing.currentStock,
        reason: `PO Receipt ${po.poNumber} (Inv: ${po.invoiceReference})`,
        performedBy: operator || 'Stock Manager',
        timestamp: new Date().toISOString()
      });
    }
  }

  db.set('purchaseOrders', [...pos]);
  db.set('ingredients', [...ingredients]);
  db.set('stockMovements', movements.slice(0, 500));

  res.json({ success: true, data: po });
});

// ----------------------------------------------------
// Sales & Profit Analytics
// ----------------------------------------------------
apiRouter.get('/analytics', (req: Request, res: Response) => {
  const { locationId } = req.query;
  let orders = db.get('orders');
  let expenses = db.get('expenses');

  if (locationId && locationId !== 'all') {
    orders = orders.filter(o => o.locationId === locationId);
    expenses = expenses.filter(e => e.locationId === locationId);
  }

  const validOrders = orders.filter(o => o.kitchenStatus !== 'CANCELLED');
  const grossSales = validOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalDiscounts = validOrders.reduce((sum, o) => sum + o.discount, 0);
  const netSales = grossSales - totalDiscounts;
  const totalTaxCollected = validOrders.reduce((sum, o) => sum + (o.cgst + o.sgst), 0);
  const totalCashCollected = validOrders.filter(o => o.paymentStatus === 'PAID' && o.paymentMethod === 'CASH_AT_COUNTER').reduce((sum, o) => sum + o.total, 0);
  const totalUpiCollected = validOrders.filter(o => o.paymentStatus === 'PAID' && o.paymentMethod === 'UPI_QR').reduce((sum, o) => sum + o.total, 0);

  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Estimate food cost (~32% benchmark of gross sales)
  const estimatedFoodCost = Math.round(grossSales * 0.32 * 100) / 100;
  const estimatedGrossProfit = Math.round((netSales - estimatedFoodCost) * 100) / 100;
  const estimatedNetOperatingProfit = Math.round((estimatedGrossProfit - totalOperatingExpenses) * 100) / 100;

  // Top selling dishes
  const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const o of validOrders) {
    for (const it of o.items) {
      if (!itemCounts[it.menuItemId]) {
        itemCounts[it.menuItemId] = { name: it.name, count: 0, revenue: 0 };
      }
      itemCounts[it.menuItemId].count += it.quantity;
      itemCounts[it.menuItemId].revenue += it.totalPrice;
    }
  }

  const topDishes = Object.values(itemCounts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  res.json({
    success: true,
    data: {
      orderCount: validOrders.length,
      grossSales,
      totalDiscounts,
      netSales,
      totalTaxCollected,
      totalCashCollected,
      totalUpiCollected,
      totalRevenueReceived: totalCashCollected + totalUpiCollected,
      estimatedFoodCost,
      estimatedGrossProfit,
      totalOperatingExpenses,
      estimatedNetOperatingProfit,
      topDishes,
      expenses
    }
  });
});

// ----------------------------------------------------
// Loyalty & Coupons
// ----------------------------------------------------
apiRouter.get('/coupons', (req: Request, res: Response) => {
  const coupons = db.get('coupons');
  res.json({ success: true, data: coupons });
});

apiRouter.post('/coupons/validate', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: 'Coupon code required' });
  }

  const clean = String(code).trim().toUpperCase();
  const coupons = db.get('coupons');
  const coupon = coupons.find(c => c.code === clean && c.isActive);

  if (!coupon) {
    return res.status(404).json({ success: false, error: 'Invalid or inactive coupon code.' });
  }

  if (new Date(coupon.validUntil).getTime() < Date.now()) {
    return res.status(400).json({ success: false, error: 'This coupon has expired.' });
  }

  if (subtotal < coupon.minOrderValue) {
    return res.status(400).json({
      success: false,
      error: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`
    });
  }

  let discount = 0;
  if (coupon.discountType === 'PERCENT') {
    discount = Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscount);
  } else {
    discount = Math.min(coupon.discountValue, coupon.maxDiscount);
  }
  discount = Math.round(discount * 100) / 100;

  res.json({ success: true, data: { code: coupon.code, discount, discountType: coupon.discountType } });
});


// ----------------------------------------------------
// Website Configuration & Video Editor
// ----------------------------------------------------
apiRouter.get('/website-config', (req: Request, res: Response) => {
  const cfg = db.get('websiteConfig');
  res.json({ success: true, data: cfg });
});

apiRouter.put('/website-config', (req: Request, res: Response) => {
  const incoming = req.body;
  const current = db.get('websiteConfig');
  const updated = { ...current, ...incoming };
  db.set('websiteConfig', updated);

  broadcastSSE('website_config_updated', updated);
  res.json({ success: true, data: updated });
});

// ----------------------------------------------------
// Audit Logs & System Backup / Recovery
// ----------------------------------------------------
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const logs = db.get('auditLogs');
  res.json({ success: true, data: logs.slice(0, 100) });
});

apiRouter.get('/system/export', (req: Request, res: Response) => {
  res.json(db.getRaw());
});

apiRouter.post('/system/restore', (req: Request, res: Response) => {
  try {
    const raw = req.body;
    db.restore(raw);
    res.json({ success: true, message: 'Database restored successfully' });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ----------------------------------------------------
// Customer Feedback & Dish Reviews
// ----------------------------------------------------
apiRouter.post('/feedback', (req: Request, res: Response) => {
  try {
    const { orderId, overallRating, foodQualityRating, serviceRating, dishReviews, dishesFeedback, comment } = req.body;
    if (!orderId || !overallRating) {
      return res.status(400).json({ success: false, error: 'Order ID and overall rating are required.' });
    }

    const orders = db.get('orders');
    const order = orders.find(o => o.id === orderId || o.displayNumber === orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const rawReviews = Array.isArray(dishReviews) ? dishReviews : (Array.isArray(dishesFeedback) ? dishesFeedback : []);
    const feedbacks = db.get('feedbacks') || [];
    const newFeedback = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderId: order.id,
      displayNumber: order.displayNumber,
      customerName: order.customerName || 'Valued Guest',
      customerPhone: order.customerPhone || '',
      overallRating: Number(overallRating) || 5,
      foodQualityRating: Number(foodQualityRating) || Number(overallRating) || 5,
      serviceRating: Number(serviceRating) || Number(overallRating) || 5,
      dishReviews: rawReviews,
      comment: (comment || '').trim(),
      locationId: order.locationId,
      createdAt: new Date().toISOString()
    };

    feedbacks.unshift(newFeedback);
    db.set('feedbacks', [...feedbacks]);

    // Audit log
    const auditLogs = db.get('auditLogs');
    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      action: 'CUSTOMER_FEEDBACK',
      entityType: 'ORDER',
      entityId: order.id,
      changedBy: newFeedback.customerName,
      details: `Received ${newFeedback.overallRating}-star feedback for Order #${order.displayNumber}`,
      timestamp: newFeedback.createdAt
    });
    db.set('auditLogs', auditLogs);

    broadcastSSE('feedback_received', newFeedback);

    res.status(201).json({ success: true, data: newFeedback });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to submit feedback' });
  }
});

apiRouter.get('/feedback', (req: Request, res: Response) => {
  const { locationId, orderId } = req.query;
  let feedbacks = db.get('feedbacks') || [];

  if (locationId && locationId !== 'all') {
    feedbacks = feedbacks.filter(f => f.locationId === locationId);
  }
  if (orderId) {
    feedbacks = feedbacks.filter(f => f.orderId === orderId);
  }

  res.json({ success: true, data: feedbacks });
});

// ----------------------------------------------------
// Event & Banquet Bookings
// ----------------------------------------------------
apiRouter.get('/events', (req: Request, res: Response) => {
  const { locationId, status, search } = req.query;
  let events = db.get('eventBookings') || [];

  if (locationId && locationId !== 'all') {
    events = events.filter(e => e.preferredLocationId === locationId);
  }
  if (status && status !== 'all') {
    events = events.filter(e => e.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    events = events.filter(e =>
      e.bookingReference.toLowerCase().includes(q) ||
      e.customerName.toLowerCase().includes(q) ||
      e.customerPhone.includes(q) ||
      e.eventType.toLowerCase().includes(q) ||
      (e.preferredHallOrArea && e.preferredHallOrArea.toLowerCase().includes(q))
    );
  }

  // Sort by date ascending (upcoming events first), then createdAt descending
  events = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  res.json({ success: true, data: events });
});

apiRouter.get('/events/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const events = db.get('eventBookings') || [];
  const event = events.find(e => e.id === id || e.bookingReference === id);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event booking not found' });
  }
  res.json({ success: true, data: event });
});

apiRouter.post('/events', (req: Request, res: Response) => {
  try {
    const {
      eventType,
      headcount,
      date,
      timeSlot,
      preferredLocationId,
      preferredHallOrArea,
      customerName,
      customerPhone,
      customerEmail,
      packagePreference,
      estimatedBudgetPerHead,
      advanceDepositPaid,
      specialRequests,
      internalNotes
    } = req.body;

    if (!eventType || !headcount || !date || !preferredLocationId || !customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: Event type, headcount, date, venue branch, customer name and phone are mandatory.'
      });
    }

    const events = db.get('eventBookings') || [];
    const now = new Date().toISOString();
    const countSeq = String(events.length + 1).padStart(3, '0');
    const bookingReference = `EVT-2026-${countSeq}`;

    const parsedHeadcount = Math.max(1, parseInt(String(headcount), 10) || 1);
    const parsedBudget = estimatedBudgetPerHead ? Math.max(0, parseFloat(String(estimatedBudgetPerHead))) : undefined;
    const totalEst = parsedBudget ? parsedBudget * parsedHeadcount : undefined;

    const newEvent: EventBooking = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingReference,
      eventType,
      headcount: parsedHeadcount,
      date: String(date).slice(0, 10),
      timeSlot: timeSlot || 'DINNER',
      preferredLocationId,
      preferredHallOrArea: preferredHallOrArea || (preferredLocationId === 'shangrilla-hazratganj' ? 'Royal Darbar Hall' : 'Highway Open Lawn'),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail?.trim() || undefined,
      packagePreference: packagePreference || 'Royal Awadhi Platinum',
      estimatedBudgetPerHead: parsedBudget,
      totalEstimatedAmount: totalEst,
      advanceDepositPaid: advanceDepositPaid ? parseFloat(String(advanceDepositPaid)) : 0,
      status: 'PENDING',
      specialRequests: specialRequests?.trim() || undefined,
      internalNotes: internalNotes?.trim() || undefined,
      createdAt: now,
      updatedAt: now
    };

    events.unshift(newEvent);
    db.set('eventBookings', [...events]);

    // Audit log
    const auditLogs = db.get('auditLogs');
    auditLogs.unshift({
      id: `aud-${Date.now()}`,
      action: 'EVENT_BOOKED',
      entityType: 'ORDER',
      entityId: newEvent.id,
      changedBy: newEvent.customerName,
      details: `Banquet/Party Request ${newEvent.bookingReference} received for ${newEvent.eventType} (${newEvent.headcount} pax on ${newEvent.date})`,
      timestamp: now
    });
    db.set('auditLogs', auditLogs);

    broadcastSSE('event_booked', newEvent);

    res.status(201).json({ success: true, data: newEvent });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to create event booking' });
  }
});

apiRouter.patch('/events/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const events = db.get('eventBookings') || [];
  const event = events.find(e => e.id === id || e.bookingReference === id);

  if (!event) {
    return res.status(404).json({ success: false, error: 'Event booking not found' });
  }

  const now = new Date().toISOString();
  if (updates.status) event.status = updates.status as EventStatus;
  if (updates.headcount) {
    event.headcount = parseInt(String(updates.headcount), 10);
    if (event.estimatedBudgetPerHead) {
      event.totalEstimatedAmount = event.headcount * event.estimatedBudgetPerHead;
    }
  }
  if (updates.date) event.date = String(updates.date).slice(0, 10);
  if (updates.timeSlot) event.timeSlot = updates.timeSlot;
  if (updates.preferredLocationId) event.preferredLocationId = updates.preferredLocationId;
  if (updates.preferredHallOrArea) event.preferredHallOrArea = updates.preferredHallOrArea;
  if (updates.eventType) event.eventType = updates.eventType;
  if (updates.customerName) event.customerName = updates.customerName;
  if (updates.customerPhone) event.customerPhone = updates.customerPhone;
  if (updates.customerEmail !== undefined) event.customerEmail = updates.customerEmail;
  if (updates.packagePreference) event.packagePreference = updates.packagePreference;
  if (updates.estimatedBudgetPerHead !== undefined) {
    event.estimatedBudgetPerHead = parseFloat(String(updates.estimatedBudgetPerHead));
    event.totalEstimatedAmount = event.headcount * event.estimatedBudgetPerHead;
  }
  if (updates.advanceDepositPaid !== undefined) event.advanceDepositPaid = parseFloat(String(updates.advanceDepositPaid));
  if (updates.specialRequests !== undefined) event.specialRequests = updates.specialRequests;
  if (updates.internalNotes !== undefined) event.internalNotes = updates.internalNotes;

  event.updatedAt = now;
  db.set('eventBookings', [...events]);

  // Audit log
  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `aud-${Date.now()}`,
    action: 'EVENT_UPDATED',
    entityType: 'ORDER',
    entityId: event.id,
    changedBy: updates.operator || 'Admin',
    details: `Event ${event.bookingReference} updated to status "${event.status}"`,
    timestamp: now
  });
  db.set('auditLogs', auditLogs);

  broadcastSSE('event_updated', event);

  res.json({ success: true, data: event });
});

apiRouter.delete('/events/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const events = db.get('eventBookings') || [];
  const index = events.findIndex(e => e.id === id || e.bookingReference === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Event booking not found' });
  }

  const removed = events.splice(index, 1)[0];
  db.set('eventBookings', [...events]);

  // Audit log
  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `aud-${Date.now()}`,
    action: 'EVENT_CANCELLED',
    entityType: 'ORDER',
    entityId: removed.id,
    changedBy: req.body?.operator || 'Admin',
    details: `Event booking ${removed.bookingReference} removed`,
    timestamp: new Date().toISOString()
  });
  db.set('auditLogs', auditLogs);

  res.json({ success: true, message: 'Event booking deleted successfully', data: removed });
});

// ----------------------------------------------------
// Loyalty Program
// ----------------------------------------------------
apiRouter.get('/loyalty/settings', (req: Request, res: Response) => {
  const settings = db.get('loyaltySettings');
  res.json({ success: true, data: settings });
});

apiRouter.put('/loyalty/settings', (req: Request, res: Response) => {
  const updates = req.body;
  const current = db.get('loyaltySettings');
  const updated: LoyaltySettings = {
    ...current,
    ...updates
  };

  db.set('loyaltySettings', updated);

  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `aud-${Date.now()}`,
    action: 'LOYALTY_SETTINGS_UPDATED',
    entityType: 'SETTINGS',
    entityId: 'loyalty',
    changedBy: updates.operator || 'Admin',
    details: `Updated loyalty program rates (${updated.earnRatePercent}% earn rate, ₹${updated.redemptionValuePerPoint}/pt)`,
    timestamp: new Date().toISOString()
  });
  db.set('auditLogs', auditLogs);

  res.json({ success: true, data: updated });
});

apiRouter.get('/loyalty/account', (req: Request, res: Response) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required.' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const accounts = db.get('loyaltyAccounts') || [];
  const settings = db.get('loyaltySettings');

  let account = accounts.find(a => {
    const accPhone = a.phone.replace(/\D/g, '');
    return accPhone && (accPhone.includes(cleanPhone) || cleanPhone.includes(accPhone));
  });

  if (!account) {
    // Return empty state or starter account for new lookup
    return res.json({
      success: true,
      data: {
        phone: String(phone),
        customerName: 'New Guest',
        points: 0,
        totalOrdersCount: 0,
        totalSpent: 0,
        tier: 'BRONZE',
        isNew: true,
        rupeesWorth: 0,
        history: [],
        currentTierPerks: settings?.tiers?.find(t => t.name === 'BRONZE')?.perks || []
      }
    });
  }

  const tierInfo = settings?.tiers?.find(t => t.name === account?.tier) || settings?.tiers?.[0];
  const rupeesWorth = Math.round(account.points * (settings?.redemptionValuePerPoint || 0.5) * 100) / 100;

  res.json({
    success: true,
    data: {
      ...account,
      isNew: false,
      rupeesWorth,
      tierLabel: tierInfo?.label || account.tier,
      tierMultiplier: tierInfo?.multiplier || 1.0,
      currentTierPerks: tierInfo?.perks || []
    }
  });
});

apiRouter.get('/loyalty/accounts', (req: Request, res: Response) => {
  const { search, tier } = req.query;
  let accounts = db.get('loyaltyAccounts') || [];
  const settings = db.get('loyaltySettings');

  if (tier && tier !== 'all') {
    accounts = accounts.filter(a => a.tier === tier);
  }

  if (search) {
    const q = String(search).toLowerCase();
    accounts = accounts.filter(a =>
      a.phone.includes(q) ||
      a.customerName.toLowerCase().includes(q)
    );
  }

  // Sort by points descending
  accounts = [...accounts].sort((a, b) => b.points - a.points);

  const enriched = accounts.map(a => {
    const tierInfo = settings?.tiers?.find(t => t.name === a.tier);
    return {
      ...a,
      rupeesWorth: Math.round(a.points * (settings?.redemptionValuePerPoint || 0.5) * 100) / 100,
      tierLabel: tierInfo?.label || a.tier
    };
  });

  res.json({ success: true, data: enriched });
});

apiRouter.post('/loyalty/adjust', (req: Request, res: Response) => {
  const { phone, pointsDelta, reason, operator } = req.body;
  if (!phone || pointsDelta === undefined) {
    return res.status(400).json({ success: false, error: 'Phone and pointsDelta are required.' });
  }

  const delta = parseInt(String(pointsDelta), 10);
  if (isNaN(delta) || delta === 0) {
    return res.status(400).json({ success: false, error: 'pointsDelta must be a non-zero integer.' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const accounts = db.get('loyaltyAccounts') || [];
  let account = accounts.find(a => {
    const accPhone = a.phone.replace(/\D/g, '');
    return accPhone && (accPhone.includes(cleanPhone) || cleanPhone.includes(accPhone));
  });

  const now = new Date().toISOString();

  if (!account) {
    account = {
      phone: String(phone).trim(),
      customerName: 'Loyalty Member',
      points: Math.max(0, delta),
      totalOrdersCount: 0,
      totalSpent: 0,
      tier: 'BRONZE',
      createdAt: now,
      history: [
        {
          pointsChange: delta,
          reason: reason || (delta > 0 ? 'Manual points credit by Admin' : 'Manual points debit by Admin'),
          timestamp: now
        }
      ]
    };
    accounts.push(account);
  } else {
    account.points = Math.max(0, account.points + delta);
    account.history.unshift({
      pointsChange: delta,
      reason: reason || (delta > 0 ? `Manual points credit (${operator || 'Admin'})` : `Manual points debit (${operator || 'Admin'})`),
      timestamp: now
    });
  }

  db.set('loyaltyAccounts', [...accounts]);

  // Audit log
  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `aud-${Date.now()}`,
    action: 'LOYALTY_POINTS_ADJUSTED',
    entityType: 'SETTINGS',
    entityId: account.phone,
    changedBy: operator || 'Admin',
    details: `${delta > 0 ? '+' : ''}${delta} points adjusted for ${account.phone} (${account.customerName}). Reason: ${reason || 'Manual Adjustment'}`,
    timestamp: now
  });
  db.set('auditLogs', auditLogs);

  res.json({ success: true, data: account });
});

// ----------------------------------------------------
// Table Reservations / Bookings
// ----------------------------------------------------
apiRouter.get('/table-bookings', (req: Request, res: Response) => {
  const { locationId, status, date } = req.query;
  let bookings = db.get('tableBookings') || [];

  if (locationId && locationId !== 'all') {
    bookings = bookings.filter(b => b.locationId === locationId);
  }
  if (status && status !== 'ALL') {
    bookings = bookings.filter(b => b.status === status);
  }
  if (date) {
    bookings = bookings.filter(b => b.date === date);
  }

  // Sort newest first
  bookings = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, data: bookings });
});

apiRouter.post('/table-bookings', (req: Request, res: Response) => {
  const {
    customerName,
    customerPhone,
    customerEmail,
    locationId,
    locationName,
    date,
    timeSlot,
    guestCount,
    seatingArea,
    specialRequests
  } = req.body;

  if (!customerName || !customerPhone || !date || !timeSlot || !guestCount) {
    return res.status(400).json({
      success: false,
      error: 'Name, phone number, date, time slot, and guest count are required.'
    });
  }

  const bookings = db.get('tableBookings') || [];
  const countToday = bookings.length + 1;
  const bookingRef = `TBL-${new Date().getFullYear()}-${String(countToday).padStart(3, '0')}`;
  const now = new Date().toISOString();

  // Find location name if not provided
  let locName = locationName;
  if (!locName) {
    const locs = db.get('locations');
    const matched = locs.find(l => l.id === locationId);
    locName = matched ? matched.name : 'Shangrilla Dining';
  }

  const newBooking: TableBooking = {
    id: `tbl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    bookingRef,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    customerEmail: customerEmail?.trim(),
    locationId: locationId || 'shangrilla-hazratganj',
    locationName: locName,
    date,
    timeSlot,
    guestCount: Number(guestCount) || 2,
    seatingArea: seatingArea || 'AC Royal Darbar Hall',
    specialRequests: specialRequests?.trim(),
    status: 'CONFIRMED',
    createdAt: now,
    updatedAt: now
  };

  bookings.unshift(newBooking);
  db.set('tableBookings', bookings);

  // Broadcast real-time update
  broadcastSSE('table_booking_created', newBooking);

  // Audit log
  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `aud-${Date.now()}`,
    action: 'TABLE_BOOKING_CREATED',
    entityType: 'ORDER',
    entityId: newBooking.id,
    changedBy: customerName,
    details: `Table booked for ${guestCount} guests at ${locName} on ${date} at ${timeSlot} (${bookingRef})`,
    timestamp: now
  });
  db.set('auditLogs', auditLogs);

  res.status(201).json({ success: true, data: newBooking });
});

apiRouter.patch('/table-bookings/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, tableAssigned, specialRequests } = req.body;

  const bookings = db.get('tableBookings') || [];
  const idx = bookings.findIndex(b => b.id === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Table reservation not found.' });
  }

  const now = new Date().toISOString();
  if (status) bookings[idx].status = status as TableBookingStatus;
  if (tableAssigned !== undefined) bookings[idx].tableAssigned = tableAssigned;
  if (specialRequests !== undefined) bookings[idx].specialRequests = specialRequests;
  bookings[idx].updatedAt = now;

  db.set('tableBookings', [...bookings]);
  broadcastSSE('table_booking_updated', bookings[idx]);

  res.json({ success: true, data: bookings[idx] });
});

// ----------------------------------------------------
// Member Registration & Account Creation
// ----------------------------------------------------
apiRouter.post('/members/register', (req: Request, res: Response) => {
  const { name, phone, email, birthday, anniversary, preferredLocationId } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'Name and phone number are required.' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number.' });
  }

  const accounts = db.get('loyaltyAccounts') || [];
  let existing = accounts.find(a => {
    const accPhone = a.phone.replace(/\D/g, '');
    return accPhone && (accPhone.includes(cleanPhone) || cleanPhone.includes(accPhone));
  });

  const now = new Date().toISOString();
  const WELCOME_BONUS = 100; // 100 points welcome gift

  if (existing) {
    // Update existing member details
    existing.customerName = name.trim();
    if (email) existing.customerEmail = email.trim();
    db.set('loyaltyAccounts', [...accounts]);

    return res.json({
      success: true,
      data: {
        ...existing,
        isNewMember: false,
        memberId: `SHG-VIP-${cleanPhone.slice(-4)}`,
        message: `Welcome back, ${existing.customerName}! Your membership is active.`
      }
    });
  }

  // Create brand-new loyalty account with 100 welcome bonus points
  const newAccount: LoyaltyAccount = {
    phone: String(phone).trim(),
    customerName: name.trim(),
    customerEmail: email?.trim(),
    points: WELCOME_BONUS,
    totalOrdersCount: 0,
    totalSpent: 0,
    tier: 'BRONZE',
    createdAt: now,
    history: [
      {
        pointsChange: WELCOME_BONUS,
        reason: 'Welcome Bonus Points for Joining Shangrilla Royal Club',
        timestamp: now
      }
    ]
  };

  accounts.unshift(newAccount);
  db.set('loyaltyAccounts', accounts);

  // Audit log
  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `aud-${Date.now()}`,
    action: 'MEMBER_REGISTERED',
    entityType: 'SETTINGS',
    entityId: newAccount.phone,
    changedBy: name,
    details: `New Royal Club member registered: ${name} (${phone}). Awarded ${WELCOME_BONUS} Welcome Bonus points.`,
    timestamp: now
  });
  db.set('auditLogs', auditLogs);

  res.status(201).json({
    success: true,
    data: {
      ...newAccount,
      isNewMember: true,
      memberId: `SHG-VIP-${cleanPhone.slice(-4)}`,
      welcomeBonus: WELCOME_BONUS,
      message: `Congratulations! You are now a Shangrilla Royal Club member with 100 points.`
    }
  });
});

// ----------------------------------------------------
// Staff Portal Authentication
// ----------------------------------------------------
apiRouter.post('/auth/staff-login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  const u = String(username).trim().toLowerCase();
  const p = String(password).trim();

  // Role credentials:
  // Kitchen Display: kitchen / chef123
  // Cashier POS: cashier / pos123
  // Master Admin: admin / shangrilla2026
  if (u === 'kitchen' && p === 'chef123') {
    return res.json({
      success: true,
      role: 'kitchen',
      name: 'Executive Bawarchi / Kitchen Head',
      location: 'Dual-Location Kitchen'
    });
  }

  if (u === 'cashier' && p === 'pos123') {
    return res.json({
      success: true,
      role: 'cashier',
      name: 'Counter Billing & Cashier Desk',
      location: 'Front of House'
    });
  }

  if (u === 'admin' && p === 'shangrilla2026') {
    return res.json({
      success: true,
      role: 'admin',
      name: 'General Manager / Owner',
      location: 'Central Control'
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid credentials. Please check your staff username and password.'
  });
});


