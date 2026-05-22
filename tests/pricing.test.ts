import { describe, it, expect } from 'vitest';
import { getLivePricing } from '../lib/pricing/parser';

describe('PRICING_DATA.md Parser', () => {
  it('should parse the markdown file and correctly extract all tool pricing', async () => {
    const registry = await getLivePricing();
    
    // Check Cursor plans
    expect(registry.tools['Cursor']).toBeDefined();
    expect(registry.tools['Cursor'].plans['pro']).toBeDefined();
    expect(registry.tools['Cursor'].plans['pro'].numericPrice).toBe(20);
    expect(registry.tools['Cursor'].plans['pro'].isCustom).toBe(false);
    expect(registry.tools['Cursor'].plans['enterprise'].isCustom).toBe(true);
    
    // Check Claude plans (including $17/mo pricing!)
    expect(registry.tools['Claude']).toBeDefined();
    expect(registry.tools['Claude'].plans['pro'].numericPrice).toBe(17);
    expect(registry.tools['Claude'].plans['team standard'].numericPrice).toBe(25);
    
    // Check ChatGPT plans
    expect(registry.tools['ChatGPT']).toBeDefined();
    expect(registry.tools['ChatGPT'].plans['team'].numericPrice).toBe(23.45);

    // Check Gemini Pro/Ultra pricing
    expect(registry.tools['Gemini']).toBeDefined();
    expect(registry.tools['Gemini'].plans['pro'].numericPrice).toBe(20.30);
    expect(registry.tools['Gemini'].plans['ultra (5x limits)'].numericPrice).toBe(67.70);
  });

  it('should parse the API tokens correctly', async () => {
    const registry = await getLivePricing();
    
    // Check Anthropic API Direct (Claude Sonnet 4.6)
    const anthropicApis = registry.apis['Anthropic API'];
    expect(anthropicApis).toBeDefined();
    expect(anthropicApis['Claude Sonnet 4.6']).toBeDefined();
    expect(anthropicApis['Claude Sonnet 4.6']['Input'].pricePerMillion).toBe(3.00);
    expect(anthropicApis['Claude Sonnet 4.6']['Output'].pricePerMillion).toBe(15.00);

    // Check OpenAI API Direct (GPT-5.5)
    const openAiApis = registry.apis['OpenAI API'];
    expect(openAiApis).toBeDefined();
    expect(openAiApis['GPT-5.5']['Input'].pricePerMillion).toBe(5.00);
    expect(openAiApis['GPT-5.5']['Output'].pricePerMillion).toBe(30.00);
  });
});
