import { GoogleGenAI } from '@google/genai';
import { db } from './db';
import { MenuItem } from '../src/types/models';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatResponse {
  reply: string;
  suggestedDishes?: MenuItem[];
  offerCode?: string;
}

export class GeminiChatService {
  private static ai: GoogleGenAI | null = null;

  private static getClient(): GoogleGenAI {
    if (!this.ai) {
      this.ai = new GoogleGenAI();
    }
    return this.ai;
  }

  public static async chat(
    userMessage: string,
    history: ChatMessage[] = [],
    locationId?: string
  ): Promise<ChatResponse> {
    const menuItems = db.get('menuItems') || [];
    const locations = db.get('locations') || [];
    const coupons = db.get('coupons') || [];

    // Filter available featured dishes
    const featuredDishes = menuItems.filter(m => m.isFeatured && m.isAvailable);

    // Build system instruction
    const systemInstruction = `You are "Nawab AI", the royal virtual concierge and gastronomy expert for SHANGRILLA in Lucknow, India.
You speak with authentic Lucknowi tehzeeb (courtesy, elegance, warmth, hospitality), greeting guests with "Adaab" or "Namaskar", addressing them respectfully as "Huzoor" or "Honored Guest".
You are knowledgeable about Lucknow's rich culinary history (Awadh dastarkhwan, dum pukht cooking, bawarchis, and rakabdars) as well as the bustling roadside dhaba culture on the Lucknow-Ayodhya highway.

RESTAURANT LOCATIONS:
1. SHANGRILLA Royal Restaurant - Hazratganj:
   - Address: 42 Mahatma Gandhi Marg, Hazratganj, Central Lucknow
   - Timing: 12:00 PM – 11:30 PM
   - Ambiance: Air-conditioned imperial dining, crystal chandeliers, classical ghazal ambiance, Lucknowi silver dastarkhwan dining, Royal Darbar Banquet Hall (150 Pax).
2. SHANGRILLA Highway Express Dhaba - Faizabad Road:
   - Address: Km 18, NH-27 Lucknow-Ayodhya National Highway (Faizabad Road), Lucknow
   - Timing: Open 24 Hours / 7 Days a week
   - Ambiance: Open-air charpai woven cots under starlight, live charcoal angithi tandoor, fresh clay kulhad kadak chai, sprawling celebration lawns (500 Pax), ample secure parking.

LIVE OFFERS & DISCOUNTS:
- 🌟 GRAND FEAST SPECIAL: 5% instant discount on all orders of ₹3,000 and above! (Coupon code: ROYAL3K or FEAST5)
- 🎁 WELCOME OFFER: 15% discount on first digital order above ₹400 (Coupon code: LUCKNOWFIRST)
- 👑 ROYAL FLAT OFF: Flat ₹100 off on orders above ₹700 (Coupon code: ROYAL100)
- 🛈 HIGHWAY EXPRESS PASS: 10% off on dhaba orders above ₹250 (Coupon code: DHABAPASS)
- 💎 ROYAL DINING CLUB: 100 free welcome points (₹50 cash discount) immediately on entering phone number, plus 5% to 10% cashback points on every subsequent visit!

FEATURED SIGNATURE DISHES:
${featuredDishes.map(d => `- ${d.name} (${d.isVeg ? 'Veg' : 'Non-Veg'}, ₹${d.price}): ${d.description} (Portion: ${d.portionSize}, Spice: ${d.spiceLevel})`).join('\n')}

ALL OTHER MENU DISHES:
${menuItems.filter(m => !m.isFeatured).map(d => `- ${d.name} (${d.isVeg ? 'Veg' : 'Non-Veg'}, ₹${d.price}): ${d.description}`).join('\n')}

INSTRUCTIONS:
1. Always warmly answer questions about dishes, ingredients, recommendations for couples, families or groups, dietary requirements (veg/jain/mild/halal/allergens), differences between Hazratganj and the Highway Dhaba, and event banquets.
2. If asked about recommendations, highlight the featured dishes and remind guests about the **5% discount on orders above ₹3,000 (code ROYAL3K)**.
3. If asked about driving directions, distances, landmarks, or how to reach either venue, use Google Maps grounding to provide accurate real-world context for Lucknow (e.g. from Charbagh Station, Airport, Gomti Nagar, Alambagh, Chowk, or Faizabad/Ayodhya highway).
4. Keep replies conversational, concise, welcoming, and helpful (typically 2-4 friendly paragraphs). Mention coupon codes when relevant.`;

    try {
      const ai = this.getClient();

      // Format contents for multi-turn chat
      const contents: any[] = [];

      // Add recent history (up to last 6 messages)
      for (const msg of history.slice(-6)) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }

      // Add latest user message
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      const withTimeout = <T>(promise: Promise<T>, ms: number = 5500): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
          )
        ]);
      };

      // Call Gemini 3.8 Flash with Google Maps grounding as requested by metadata
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            tools: [{ googleMaps: {} }]
          }
        }),
        6000
      );

      const replyText = response.text || '';

      // Match dishes mentioned in response or user query to provide interactive quick-add cards
      const matchedDishes = this.findMatchingDishes(userMessage + ' ' + replyText, menuItems);

      return {
        reply: replyText,
        suggestedDishes: matchedDishes.slice(0, 3),
        offerCode: userMessage.toLowerCase().includes('3000') || userMessage.toLowerCase().includes('3k') || replyText.includes('ROYAL3K')
          ? 'ROYAL3K'
          : undefined
      };
    } catch (err: any) {
      console.warn('[GeminiChat] Calling Gemini with tools encountered issue, applying fallback:', err.message);

      // Attempt second call without tools if tools quota or hybrid mode errored
      try {
        const ai = this.getClient();
        const withTimeout = <T>(promise: Promise<T>, ms: number = 3500): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
            )
          ]);
        };

        const fallbackResp = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
              { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${userMessage}` }] }
            ]
          }),
          3500
        );

        if (fallbackResp.text) {
          const matchedDishes = this.findMatchingDishes(userMessage + ' ' + fallbackResp.text, menuItems);
          return {
            reply: fallbackResp.text,
            suggestedDishes: matchedDishes.slice(0, 3)
          };
        }
      } catch (innerErr) {
        console.warn('[GeminiChat] Secondary model call also hit limit, utilizing intelligent local Awadhi response:', innerErr);
      }

      // High-fidelity domain fallback when external quota is unavailable
      return this.generateSmartLocalResponse(userMessage, menuItems, featuredDishes);
    }
  }

  /**
   * Helper to identify dishes mentioned in prompt or response for interactive UI cards
   */
  private static findMatchingDishes(text: string, allItems: MenuItem[]): MenuItem[] {
    const lower = text.toLowerCase();
    const found: MenuItem[] = [];

    for (const item of allItems) {
      const nameLower = item.name.toLowerCase();
      const firstWords = nameLower.split(' ').slice(0, 2).join(' ');
      if (
        lower.includes(nameLower) ||
        (firstWords.length > 5 && lower.includes(firstWords)) ||
        (item.id.includes('galouti') && lower.includes('galouti')) ||
        (item.id.includes('biryani') && lower.includes('biryani')) ||
        (item.id.includes('dal-makhani') && (lower.includes('dal') || lower.includes('makhani'))) ||
        (item.id.includes('butter-chicken') && lower.includes('butter chicken')) ||
        (item.id.includes('shahi-tukda') && lower.includes('shahi tukda')) ||
        (item.id.includes('kulhad-chai') && (lower.includes('chai') || lower.includes('tea')))
      ) {
        if (!found.some(f => f.id === item.id)) {
          found.push(item);
        }
      }
    }

    return found;
  }

  /**
   * Intelligent local Awadhi Concierge responses when API rate limits are encountered
   */
  private static generateSmartLocalResponse(
    query: string,
    menuItems: MenuItem[],
    featuredDishes: MenuItem[]
  ): ChatResponse {
    const q = query.toLowerCase();

    // 5% discount or offers query
    if (q.includes('discount') || q.includes('offer') || q.includes('coupon') || q.includes('3000') || q.includes('3k')) {
      return {
        reply: `Adaab Huzoor! We have delightful royal offers active today for your dining pleasure:

🌟 **5% Grand Feast Discount**:
Enjoy an instant **5% discount on all orders of ₹3,000 and above**! Simply apply coupon code **ROYAL3K** at checkout, or our billing system will automatically calculate the savings for your feast.

🎁 **Other Active Privileges**:
• **LUCKNOWFIRST**: 15% off on your first digital order above ₹400.
• **ROYAL100**: Flat ₹100 off on orders above ₹700.
• **DHABAPASS**: 10% off for highway travelers on orders above ₹250.
• **Royal Dining Club**: Register your phone number to immediately receive 100 welcome points (₹50 discount) plus 5% cashback points on every meal!

Would you like me to recommend our royal biryanis or signature kebabs to curate a ₹3,000 royal gathering?`,
        suggestedDishes: featuredDishes.slice(0, 3),
        offerCode: 'ROYAL3K'
      };
    }

    // Featured dishes query
    if (q.includes('featured') || q.includes('special') || q.includes('recommend') || q.includes('best') || q.includes('famous')) {
      return {
        reply: `Adaab! Our royal bawarchis take immense pride in SHANGRILLA's featured heritage dishes:

1. **Galouti Kebab with Ulte Tawe Ka Paratha (₹360)**:
Smoked finely minced lamb infused with 160 traditional Awadhi potli spices, slow-melted over charcoal and served on soft saffron parathas.

2. **Royal Lucknowi Awadhi Dum Biryani (₹390 Chicken / ₹460 Mutton)**:
Aged Daawat basmati rice slow-dum cooked in sealed clay handis with pure desi cow bilona ghee and saffron-scented milk.

3. **Highway Dhaba Charcoal Dal Makhani (₹260)**:
Whole black urad lentils slow-simmered for 16 hours over charcoal embers, finished with fresh farm-churned white butter.

4. **Dhaba Style Smokey Butter Chicken (₹380)**:
Clay tandoor char-roasted chicken in a rich, buttery tomato makhani gravy.

5. **Shahi Awadhi Tukda with Rabdi (₹180)**:
Crisp ghee-fried bread bathed in zafrani syrup and thick malai rabdi with pure silver vark.

You can add any of these chef specials directly to your order below!`,
        suggestedDishes: featuredDishes.slice(0, 3)
      };
    }

    // Direction or location query
    if (q.includes('where') || q.includes('location') || q.includes('address') || q.includes('reach') || q.includes('distance') || q.includes('hazratganj') || q.includes('dhaba')) {
      return {
        reply: `Adaab! SHANGRILLA welcomes you at two landmark Lucknow venues:

🏛️ **Hazratganj Royal Restaurant**:
• **Location**: 42 Mahatma Gandhi Marg, Hazratganj, Central Lucknow (near Janpath Market).
• **Timings**: 12:00 PM to 11:30 PM.
• **Setting**: Regal air-conditioned dining, crystal chandeliers, Lucknowi dastarkhwan, and Royal Darbar banquet hall. About 15 minutes from Charbagh Railway Station.

🚚 **Highway Express Dhaba**:
• **Location**: Km 18, NH-27 Lucknow-Ayodhya National Highway (Faizabad Road), Lucknow.
• **Timings**: Open 24/7 round the clock!
• **Setting**: Authentic roadside open-air lawn, charpai seating under starlight, live charcoal angithi grills, and hot kulhad chai for highway travelers.`,
        suggestedDishes: featuredDishes.slice(0, 2)
      };
    }

    // Default polite Awadhi concierge reply
    return {
      reply: `Adaab Huzoor! Welcome to SHANGRILLA Lucknow.

I am your personal culinary concierge. I can assist you with:
• Curating the perfect Awadhi dastarkhwan for you or your party.
• Applying our **5% discount on orders of ₹3,000+** using code **ROYAL3K**.
• Finding vegetarian or non-vegetarian signature specials.
• Answering questions about our Hazratganj heritage hall or our 24/7 Highway Express Dhaba.

How may I serve you today, Huzoor?`,
      suggestedDishes: featuredDishes.slice(0, 3)
    };
  }
}
