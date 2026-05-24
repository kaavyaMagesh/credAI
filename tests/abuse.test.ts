import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../app/api/audit/save/route';
import { checkRateLimit, rateLimitMap } from '../lib/abuse/limiter';

describe('Security & Abuse Protection Tests', () => {
  beforeEach(() => {
    rateLimitMap.clear();
  });

  describe('Rate Limiter', () => {
    it('should allow up to 5 requests in a window and then rate limit', () => {
      const ip = '192.168.1.1';
      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit(ip)).toBe(true);
      }
      // 6th request should be blocked
      expect(checkRateLimit(ip)).toBe(false);
    });

    it('should track rate limits independently by IP address', () => {
      const ipA = '192.168.1.100';
      const ipB = '192.168.1.200';

      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit(ipA)).toBe(true);
      }
      // ipA should be limited
      expect(checkRateLimit(ipA)).toBe(false);

      // ipB should still be fully allowed
      expect(checkRateLimit(ipB)).toBe(true);
    });
  });

  describe('Honeypot Bot Trap', () => {
    it('should immediately deflect a bot request if website honeypot is populated', async () => {
      const mockPayload = {
        teamSize: 10,
        useCase: 'coding',
        tools: [],
        email: 'bot@spam.com',
        website: 'http://my-bot-site.ru' // filled honeypot
      };

      const request = new Request('http://localhost:3000/api/audit/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockPayload)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.slug).toBe('mock-bot-slug');
      expect(data.calculatedResult.aiSummary).toContain('Bot activity deflected.');
    });
  });
});
