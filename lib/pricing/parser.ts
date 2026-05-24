import fs from 'fs';
import path from 'path';

export interface PlanPricing {
  planName: string;
  rawPrice: string;
  numericPrice: number; // monthly per-seat price (or flat if flat plan)
  isCustom: boolean;
  officialUrl: string;
  verifiedDate: string;
}

export interface ToolPricing {
  toolName: string;
  plans: Record<string, PlanPricing>;
  sourceUrl?: string;
  lastVerified?: string;
}

export interface ApiTokenPricing {
  modelName: string;
  inputType: 'Input' | 'Output' | 'Cache Write' | 'Cache Read' | 'Cached Input';
  pricePerMillion: number; // USD per 1M tokens
  officialUrl: string;
  verifiedDate: string;
}

export interface ParsedPricingRegistry {
  tools: Record<string, ToolPricing>;
  apis: Record<string, Record<string, Record<string, ApiTokenPricing>>>; // apiName -> modelName -> type -> pricing
}

// Memory cache to avoid repeated file reads in production, while keeping it live (1-minute TTL for safety)
let cache: { data: ParsedPricingRegistry; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000;

/**
 * Clean and convert pricing string to absolute numeric monthly per-seat cost
 */
function parseNumericPrice(priceStr: string): { numericPrice: number; isCustom: boolean } {
  const normalized = priceStr.toLowerCase().trim();
  
  if (normalized.includes('free') || normalized.includes('$0')) {
    return { numericPrice: 0, isCustom: false };
  }
  if (normalized.includes('custom') || normalized.includes('contact sales')) {
    return { numericPrice: -1, isCustom: true };
  }
  
  // Extract numbers and decimals
  const match = priceStr.match(/\$?([0-9]+(\.[0-9]+)?)/);
  if (match) {
    return { numericPrice: parseFloat(match[1]), isCustom: false };
  }
  
  return { numericPrice: 0, isCustom: true };
}

/**
 * Live parses the PRICING_DATA.md file from the filesystem.
 */
export async function getLivePricing(): Promise<ParsedPricingRegistry> {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return cache.data;
  }

  const filePath = path.join(process.cwd(), 'PRICING_DATA.md');
  const fileContent = await fs.promises.readFile(filePath, 'utf-8');
  
  const registry: ParsedPricingRegistry = {
    tools: {},
    apis: {},
  };

  const lines = fileContent.split('\n');
  let currentSection: 'tool' | 'api' | null = null;
  let currentHeaderName = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect section headers e.g. "## Cursor" or "## Anthropic API Direct"
    if (trimmed.startsWith('## ')) {
      const header = trimmed.replace('## ', '').trim();
      currentHeaderName = header;
      
      if (header.toLowerCase().includes('api direct')) {
        currentSection = 'api';
        const apiKey = header.replace(' Direct', '').trim();
        registry.apis[apiKey] = {};
      } else {
        currentSection = 'tool';
        registry.tools[header] = {
          toolName: header,
          plans: {},
        };
      }
      continue;
    }

    // Parse list items
    if (trimmed.startsWith('- ') && currentSection) {
      // Regex for parsing standard plan lines: "- Plan Name: Pricing — URL — verified Date"
      // Example: "- Pro: $20/user/month — https://cursor.com/pricing — verified 2026-05-22"
      const match = trimmed.match(/^- (.*?): (.*?) — (.*?) — verified (.*?)$/);
      
      if (match) {
        const [, planName, rawPrice, url, date] = match;
        
        if (currentSection === 'tool') {
          const { numericPrice, isCustom } = parseNumericPrice(rawPrice);
          
          registry.tools[currentHeaderName].plans[planName.toLowerCase()] = {
            planName,
            rawPrice,
            numericPrice,
            isCustom,
            officialUrl: url.trim(),
            verifiedDate: date.trim(),
          };
          
          // Hydrate root metadata from the first plan found
          registry.tools[currentHeaderName].sourceUrl = url.trim();
          registry.tools[currentHeaderName].lastVerified = date.trim();
        } else if (currentSection === 'api') {
          // Parsing API direct items: "- Claude Opus 4.7 Input: $5.00/1M tokens — URL — verified Date"
          // We can split model name from input/output type
          // Find the last space before "Input", "Output", "Cache Write", "Cache Read", "Cached Input"
          const typeMatch = planName.match(/(.*?)\s+(Input|Output|Cache Write|Cache Read|Cached Input)$/i);
          
          if (typeMatch) {
            const [, modelName, tokenType] = typeMatch;
            const cleanModel = modelName.trim();
            const cleanType = tokenType.trim() as ApiTokenPricing['inputType'];
            const apiKey = currentHeaderName.replace(' Direct', '').trim();
            
            if (!registry.apis[apiKey][cleanModel]) {
              registry.apis[apiKey][cleanModel] = {} as any;
            }
            
            const { numericPrice } = parseNumericPrice(rawPrice);
            
            registry.apis[apiKey][cleanModel][cleanType] = {
              modelName: cleanModel,
              inputType: cleanType,
              pricePerMillion: numericPrice,
              officialUrl: url.trim(),
              verifiedDate: date.trim(),
            };
          }
        }
      }
    }
  }

  cache = {
    data: registry,
    timestamp: now,
  };

  return registry;
}
