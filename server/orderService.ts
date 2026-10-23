import { db, getCurrent48HourCycleId } from './db';
import { Order, OrderItem, KitchenStatus, PaymentStatus, PaymentMethod } from '../src/types/models';

export class OrderService {
  /**
   * Generates next atomic short order number within the current 48-hour cycle for a location.
   * Returns a 3-digit padded number like '024'.
   */
  public static getNextDisplayNumber(locationId: string): { displayNumber: string; cycleId: string } {
    const currentCycleId = getCurrent48HourCycleId();
    const counters = db.get('orderCounters');
    
    let locCounter = counters[locationId];
    if (!locCounter || locCounter.cycleId !== currentCycleId) {
      locCounter = { cycleId: currentCycleId, counter: 1 };
    } else {
      locCounter.counter += 1;
    }
    
    counters[locationId] = locCounter;
    db.set('orderCounters', { ...counters });
    
    const padded = String(locCounter.counter).padStart(3, '0');
    return { displayNumber: padded, cycleId: currentCycleId };
  }

  /**
   * Authoritative server-side price calculation and validation.
   */
  public static calculateOrderTotals(
    locationId: string,
    rawItems: { menuItemId: string; quantity: number; selectedAddonIds?: string[]; specialInstructions?: string }[],
    couponCode?: string,
    pointsToRedeem?: number,
    customerPhone?: string
  ): {
    verifiedItems: OrderItem[];
    subtotal: number;
    discount: number;
    couponCode?: string;
    pointsRedeemed?: number;
    pointsDiscount?: number;
    cgst: number;
    sgst: number;
    total: number;
  } {
    const menuItems = db.get('menuItems');
    const coupons = db.get('coupons');
    const locations = db.get('locations');
    const loyaltySettings = db.get('loyaltySettings');
    const location = locations.find(l => l.id === locationId) || locations[0];

    const verifiedItems: OrderItem[] = [];
    let subtotal = 0;

    for (const raw of rawItems) {
      const menuItem = menuItems.find(m => m.id === raw.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${raw.menuItemId}`);
      }
      if (!menuItem.isAvailable) {
        throw new Error(`Dish "${menuItem.name}" is currently sold out.`);
      }

      const basePrice = menuItem.discountedPrice ?? menuItem.price;
      let itemPrice = basePrice;
      const selectedAddons: { name: string; price: number }[] = [];

      if (raw.selectedAddonIds && raw.selectedAddonIds.length > 0 && menuItem.customizationGroups) {
        for (const grp of menuItem.customizationGroups) {
          for (const opt of grp.options) {
            if (raw.selectedAddonIds.includes(opt.id)) {
              selectedAddons.push({ name: opt.name, price: opt.price });
              itemPrice += opt.price;
            }
          }
        }
      }

      const lineTotal = Math.round(itemPrice * raw.quantity * 100) / 100;
      subtotal += lineTotal;

      verifiedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: basePrice,
        quantity: raw.quantity,
        selectedAddons,
        specialInstructions: raw.specialInstructions?.trim() || undefined,
        totalPrice: lineTotal
      });
    }

    // Apply Coupon
    let discount = 0;
    let validCouponCode: string | undefined;

    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = coupons.find(c => c.code === cleanCode && c.isActive);
      if (coupon) {
        const isExpired = new Date(coupon.validUntil).getTime() < Date.now();
        const meetsMin = subtotal >= coupon.minOrderValue;
        if (!isExpired && meetsMin) {
          if (coupon.discountType === 'PERCENT') {
            const rawDiscount = (subtotal * coupon.discountValue) / 100;
            discount = Math.min(rawDiscount, coupon.maxDiscount);
          } else {
            discount = Math.min(coupon.discountValue, coupon.maxDiscount);
          }
          discount = Math.round(discount * 100) / 100;
          validCouponCode = coupon.code;

          // Increment coupon usage
          coupon.timesUsed += 1;
          db.set('coupons', [...coupons]);
        }
      }
    }

    // Apply Loyalty Points Redemption
    let actualPointsRedeemed = 0;
    let pointsDiscount = 0;

    if (pointsToRedeem && pointsToRedeem > 0 && customerPhone) {
      const cleanPhone = customerPhone.replace(/\D/g, '');
      const accounts = db.get('loyaltyAccounts') || [];
      const account = accounts.find(a => {
        const accPhone = a.phone.replace(/\D/g, '');
        return accPhone && (accPhone.includes(cleanPhone) || cleanPhone.includes(accPhone));
      });

      if (account && account.points >= (loyaltySettings?.minPointsToRedeem || 50)) {
        const pointsUsable = Math.min(account.points, pointsToRedeem);
        const rawPointsVal = pointsUsable * (loyaltySettings?.redemptionValuePerPoint || 0.5);
        const maxAllowedDiscount = (subtotal * (loyaltySettings?.maxRedeemPercent || 50)) / 100;

        pointsDiscount = Math.min(rawPointsVal, maxAllowedDiscount);
        actualPointsRedeemed = Math.ceil(pointsDiscount / (loyaltySettings?.redemptionValuePerPoint || 0.5));
        pointsDiscount = Math.round(pointsDiscount * 100) / 100;
      }
    }

    const totalDeductions = discount + pointsDiscount;
    const discountedSubtotal = Math.max(0, subtotal - totalDeductions);
    
    // 5% GST (2.5% CGST + 2.5% SGST)
    const gstRate = location.gstRate || 5;
    const halfRate = gstRate / 2;
    const cgst = Math.round(((discountedSubtotal * halfRate) / 100) * 100) / 100;
    const sgst = Math.round(((discountedSubtotal * halfRate) / 100) * 100) / 100;
    const total = Math.round((discountedSubtotal + cgst + sgst) * 100) / 100;

    return {
      verifiedItems,
      subtotal,
      discount,
      couponCode: validCouponCode,
      pointsRedeemed: actualPointsRedeemed > 0 ? actualPointsRedeemed : undefined,
      pointsDiscount: pointsDiscount > 0 ? pointsDiscount : undefined,
      cgst,
      sgst,
      total
    };
  }

  /**
   * Deducts inventory based on dish recipes when kitchen starts preparing.
   */
  public static consumeIngredientsForOrder(order: Order, performedBy: string): void {
    const recipes = db.get('recipes');
    const ingredients = db.get('ingredients');
    const movements = db.get('stockMovements');

    for (const item of order.items) {
      const recipe = recipes.find(r => r.menuItemId === item.menuItemId);
      if (!recipe) continue;

      for (const req of recipe.ingredients) {
        const ingredient = ingredients.find(ing => ing.id === req.ingredientId);
        if (!ingredient) continue;

        const totalQty = (req.quantityRequired * item.quantity) / recipe.yieldServings;
        ingredient.currentStock = Math.max(0, Math.round((ingredient.currentStock - totalQty) * 1000) / 1000);

        movements.unshift({
          id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          locationId: order.locationId,
          type: 'ORDER_CONSUMPTION',
          quantity: -totalQty,
          balanceAfter: ingredient.currentStock,
          reason: `Auto-consumption for Order #${order.displayNumber} (${item.quantity}x ${item.name})`,
          referenceOrderId: order.id,
          performedBy,
          timestamp: new Date().toISOString()
        });
      }
    }

    db.set('ingredients', [...ingredients]);
    db.set('stockMovements', movements.slice(0, 500)); // retain recent 500 movements
  }

  /**
   * Awards loyalty points to customer based on tier multiplier, and deducts redeemed points.
   */
  public static awardLoyaltyPoints(order: Order): void {
    if (!order.customerPhone) return;
    const phone = order.customerPhone.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const accounts = db.get('loyaltyAccounts') || [];
    const settings = db.get('loyaltySettings');
    
    let account = accounts.find(a => {
      const accPhone = a.phone.replace(/\D/g, '');
      return accPhone && (accPhone.includes(cleanPhone) || cleanPhone.includes(accPhone));
    });

    const calculateTier = (totalSpent: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'SHAHI_ROYAL' => {
      if (totalSpent >= 20000) return 'SHAHI_ROYAL';
      if (totalSpent >= 7500) return 'GOLD';
      if (totalSpent >= 2500) return 'SILVER';
      return 'BRONZE';
    };

    const getMultiplier = (tier: string): number => {
      const t = settings?.tiers?.find(item => item.name === tier);
      return t ? t.multiplier : 1.0;
    };

    if (!account) {
      const initialTier = calculateTier(order.total);
      const baseEarn = (order.total * (settings?.earnRatePercent || 5)) / 100;
      const pointsEarned = Math.round(baseEarn * getMultiplier(initialTier));

      account = {
        phone,
        customerName: order.customerName || 'Valued Guest',
        points: Math.max(0, pointsEarned),
        totalOrdersCount: 1,
        totalSpent: order.total,
        tier: initialTier,
        createdAt: new Date().toISOString(),
        history: [
          {
            orderId: order.id,
            pointsChange: pointsEarned,
            reason: `Earned points on Order #${order.displayNumber} (${initialTier} Tier)`,
            timestamp: new Date().toISOString()
          }
        ]
      };
      accounts.push(account);
    } else {
      const newTotalSpent = Math.round((account.totalSpent + order.total) * 100) / 100;
      const currentTier = calculateTier(newTotalSpent);
      account.tier = currentTier;
      account.totalSpent = newTotalSpent;
      account.totalOrdersCount += 1;

      // Deduct redeemed points if any
      if (order.pointsRedeemed && order.pointsRedeemed > 0) {
        account.points = Math.max(0, account.points - order.pointsRedeemed);
        account.history.unshift({
          orderId: order.id,
          pointsChange: -order.pointsRedeemed,
          reason: `Redeemed ${order.pointsRedeemed} points for ₹${order.pointsDiscount || 0} off on Order #${order.displayNumber}`,
          timestamp: new Date().toISOString()
        });
      }

      // Add earned points
      const baseEarn = (order.total * (settings?.earnRatePercent || 5)) / 100;
      const pointsEarned = Math.round(baseEarn * getMultiplier(currentTier));
      if (pointsEarned > 0) {
        account.points += pointsEarned;
        account.history.unshift({
          orderId: order.id,
          pointsChange: pointsEarned,
          reason: `Earned ${pointsEarned} points on Order #${order.displayNumber} (${currentTier} Tier)`,
          timestamp: new Date().toISOString()
        });
      }
    }

    db.set('loyaltyAccounts', [...accounts]);
  }
}
