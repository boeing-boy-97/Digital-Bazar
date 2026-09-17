# AI - Digital Bazar

## Principles
- Grounded in actual DB data, never invent price/availability
- Permission-aware: customer only sees allowed products, shopkeeper only own shop
- Observable: logs tool calls to ai_tool_calls
- Cost-aware, rate-limited ready
- Resistant to prompt injection: treat product descriptions as untrusted
- Deterministic where structured output required (JSON mode)
- Can say "I don't know"
- Never directly execute payment/refund/stock deletion via natural language alone - requires explicit confirmation

## Provider
- OpenAI SDK, model gpt-4o-mini (configurable via OPENAI_MODEL)
- Falls back to rule-based when OPENAI_API_KEY missing, so app works without key
- Vision: gpt-4o-mini with image_url

## Features

### 1. Smart Shopping Assistant
**Endpoint**: POST /api/ai/assistant
**Input**: "Mujhe 2 bathroom ke liye plumbing material chahiye"
**System Prompt**: Understand Hinglish, ask clarifying only if critical, generate structured list, never invent prices, JSON {clarifications, items: [{name, quantity, unit, reason}], confidence}
**Flow**: User message → AI generates list → Try to match products in DB if shopId provided → Return type: shopping_list with matchedProduct
**UI**: Shows list with review step, customer must confirm before cart

### 2. Natural Language Search
**Endpoint**: POST /api/ai/search
**Input**: "I need waterproof outdoor wall paint"
**Output**: Filters {category=paint, features=[waterproof], use_case=outdoor, keywords=[paint]}
**Then**: Query actual product DB with filters
**If no match**: "I couldn't find an exact match in this shop"

### 3. Product Categorization
**Endpoint**: POST /api/ai/categorize
**Input**: "Astral CPVC Elbow 1 inch"
**Output**: {category: Plumbing, subcategory: CPVC Fittings, type: Elbow, size: 1 inch, material: CPVC, brand: Astral}
**Shopkeeper reviews before saving**

### 4. Description Generation
**Input**: {name, brand, size, category}
**Output**: Professional 2-3 sentence description
**Not auto-published**

### 5. Image Product Search
**Endpoint**: POST /api/ai/vision
**Input**: base64 image
**Prompt**: Identify hardware product, return JSON {category, productType, attributes, searchKeywords, confidence}
**Then**: Search catalog with keywords
**Show confidence, disclaimer: approximate, verify**

### 6. Voice Shopping
**Frontend**: Web Speech API (webkitSpeechRecognition), lang en-IN
**Flow**: Voice → transcript → POST /api/ai/assistant or /api/ai/search → intent extraction → quantity extraction → confirmation → cart
**Example**: "Mujhe 500 bricks aur 10 cement bags chahiye" → Red Brick ×500, Cement ×10

### 7. Recommendations
- Based on previous orders, category, shop inventory, popularity
- Never recommend unavailable products
- Simple: order history + same category + top products

### 8. Demand Forecasting
**Model**: Baseline - recent sales + avg daily + trend
**Output**: {forecast, historical trend, confidence, data coverage}
**Example**: "Cement demand may be higher next week based on recent sales" + confidence 68% + data: 45 orders
**Falls back to threshold when insufficient data**

### 9. Low Stock Prediction
**Logic**: current inventory + recent sales + avg daily → "May run out in 4 days"
**Fallback**: simple threshold

### 10. Business Assistant
**Prompt**: "Ask Your Business" - "Which products sold most this month?" "Which products are low?"
**Tools**: search_products, get_product, check_inventory, get_shop, get_customer_orders, get_shop_orders, get_shop_sales, get_low_stock_products, get_recommendations, get_demand_forecast
**Architecture**: User → AI → Intent → Authorized tool (checks shopId matches user) → DB query → Result → AI response
**Never allow access to another shop's data**

## Tools Registry
- Defined in lib/ai/service.ts as aiTools
- Each tool has name, description, parameters JSON schema, handler with auth check
- Handlers query Prisma with shopId scoping

## Security
- System instructions separate from user request and DB content
- Product descriptions, reviews, shop descriptions treated as untrusted, not followed as instructions
- Structured tool schemas prevent injection
- All AI calls server-side, API key never exposed

## Cost & Rate Limiting
- Temperature low for structured (0.1-0.3), higher for description (0.7)
- Max tokens limited
- Ready for rate limiting per user

## Testing AI
- Without OPENAI_API_KEY, fallback rule-based returns realistic data
- With key, full functionality
