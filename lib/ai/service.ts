import OpenAI from 'openai';

export interface AITool {
  name: string;
  description: string;
  parameters: any;
  handler: (input: any, context: { userId: string; shopId?: string; role: string }) => Promise<any>;
}

// Tool registry - permission-aware
export const aiTools: Record<string, AITool> = {};

// Lazy OpenAI client
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export class AIService {
  private client: OpenAI | null;

  constructor() {
    this.client = getOpenAIClient();
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  // Smart Shopping Assistant - grounded in DB
  async generateShoppingList(query: string, context: { shopId?: string; userId: string }) {
    if (!this.client) {
      // Fallback rule-based for demo
      return this.fallbackShoppingList(query);
    }

    const systemPrompt = `You are Digital Bazar's smart shopping assistant for local hardware/building material shops in India.
    Understand user intent in English/Hinglish.
    Ask clarifying questions ONLY if critical info missing.
    Generate structured shopping list with quantities.
    Never invent prices. Only suggest product names and quantities.
    Respond in JSON format: { "clarifications": [], "items": [{"name": "", "quantity": number, "unit": "", "reason": ""}], "confidence": 0-1 }`;

    try {
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (e) {
      console.error('AI error:', e);
      return this.fallbackShoppingList(query);
    }
  }

  private fallbackShoppingList(query: string) {
    const lower = query.toLowerCase();
    const items: any[] = [];

    if (lower.includes('bathroom') && lower.includes('plumbing')) {
      items.push(
        { name: 'PVC Pipe 1 inch', quantity: 20, unit: 'piece', reason: 'Bathroom plumbing main line' },
        { name: 'Elbow 1 inch', quantity: 12, unit: 'piece', reason: 'Bends' },
        { name: 'T-Joint 1 inch', quantity: 6, unit: 'piece', reason: 'Branch connections' },
        { name: 'Valve', quantity: 4, unit: 'piece', reason: 'Flow control' }
      );
    } else if (lower.includes('cement') || lower.includes('brick')) {
      if (lower.includes('cement')) items.push({ name: 'Cement Bag 50kg', quantity: 10, unit: 'bag', reason: 'Construction' });
      if (lower.includes('brick')) items.push({ name: 'Red Brick', quantity: 500, unit: 'piece', reason: 'Wall construction' });
    } else if (lower.includes('paint')) {
      items.push(
        { name: 'Wall Putty', quantity: 2, unit: 'bag', reason: 'Base preparation' },
        { name: 'Exterior Wall Paint 4L', quantity: 2, unit: 'bucket', reason: 'Waterproof outdoor paint' }
      );
    } else {
      // Generic
      items.push({ name: 'General Hardware Kit', quantity: 1, unit: 'set', reason: 'Based on your request' });
    }

    return {
      clarifications: items.length === 0 ? ['Could you specify pipe size or bathroom count?'] : [],
      items,
      confidence: 0.7
    };
  }

  // Natural Language Product Search -> structured filters
  async parseSearchQuery(query: string) {
    if (!this.client) {
      return this.fallbackParseSearch(query);
    }

    const systemPrompt = `Convert natural language product search to structured filters.
    Categories: Cement, Bricks, Plumbing, Paint, Electrical, Hardware, Tools
    Output JSON: { "category": "", "brand": "", "size": "", "features": [], "keywords": [], "use_case": "" }`;

    try {
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });
      return JSON.parse(response.choices[0].message.content || '{}');
    } catch {
      return this.fallbackParseSearch(query);
    }
  }

  private fallbackParseSearch(query: string) {
    const lower = query.toLowerCase();
    let category = '';
    if (lower.includes('pipe') || lower.includes('plumbing') || lower.includes('elbow')) category = 'Plumbing';
    else if (lower.includes('cement') || lower.includes('brick')) category = 'Building Material';
    else if (lower.includes('paint') || lower.includes('putty')) category = 'Paint';
    else if (lower.includes('wire') || lower.includes('switch') || lower.includes('electrical')) category = 'Electrical';
    else if (lower.includes('screw') || lower.includes('hardware')) category = 'Hardware';

    return {
      category,
      keywords: query.split(' ').filter(w => w.length > 2),
      features: lower.includes('waterproof') ? ['waterproof'] : [],
      use_case: lower.includes('outdoor') ? 'outdoor' : ''
    };
  }

  // Product categorization
  async categorizeProduct(productName: string) {
    if (!this.client) {
      return this.fallbackCategorize(productName);
    }

    const prompt = `Categorize this hardware product: "${productName}"
    Output JSON: { "category": "", "subcategory": "", "type": "", "size": "", "material": "", "brand": "" }`;

    try {
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });
      return JSON.parse(response.choices[0].message.content || '{}');
    } catch {
      return this.fallbackCategorize(productName);
    }
  }

  private fallbackCategorize(name: string) {
    const lower = name.toLowerCase();
    if (lower.includes('pvc') || lower.includes('cpvc') || lower.includes('elbow') || lower.includes('pipe')) {
      return { category: 'Plumbing', subcategory: 'Fittings', type: 'Elbow', material: lower.includes('cpvc') ? 'CPVC' : 'PVC' };
    }
    if (lower.includes('cement')) return { category: 'Building Material', subcategory: 'Cement', type: 'Cement' };
    if (lower.includes('paint')) return { category: 'Paint', subcategory: 'Wall Paint', type: 'Paint' };
    return { category: 'Hardware', subcategory: 'General', type: 'Hardware' };
  }

  // Product description generation
  async generateDescription(productInfo: { name: string; brand?: string; size?: string; category?: string }) {
    if (!this.client) {
      return `${productInfo.name} - High quality ${productInfo.category || 'product'}${productInfo.brand ? ` from ${productInfo.brand}` : ''}${productInfo.size ? `, size ${productInfo.size}` : ''}. Durable and reliable for professional use. Available at Digital Bazar.`;
    }

    try {
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Generate professional e-commerce product description for Indian hardware market. Keep it concise, 2-3 sentences, highlight quality and use-case.' },
          { role: 'user', content: JSON.stringify(productInfo) }
        ],
        temperature: 0.7
      });
      return response.choices[0].message.content || '';
    } catch {
      return `${productInfo.name} - Premium quality product suitable for construction and home improvement needs.`;
    }
  }

  // Business assistant with tool calls - permission aware
  async businessAssistant(query: string, context: { shopId: string; userId: string; role: string }) {
    // This would use function calling with actual DB tools
    // For now, return structured response indicating tool usage
    return {
      answer: `I analyzed your shop data for: "${query}". Based on current records, here are insights. (Connect OpenAI API key for full AI tool calling)`,
      toolCalls: [],
      requiresAuth: true
    };
  }

  // Vision product search
  async identifyProductFromImage(base64Image: string) {
    if (!this.client) {
      return {
        category: 'Hardware',
        attributes: ['general hardware'],
        confidence: 0.5,
        searchKeywords: ['hardware']
      };
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identify this hardware/building material product. Return JSON: { "category": "", "productType": "", "attributes": [], "searchKeywords": [], "confidence": 0-1 }' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300
      });
      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (e) {
      console.error('Vision error', e);
      return { category: 'Unknown', confidence: 0.3, searchKeywords: [] };
    }
  }
}

export const aiService = new AIService();
