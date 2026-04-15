import { test, expect } from '@playwright/test';
import { env } from '../../src/config/env';

interface MythologyEntity {
  id: number;
  name: string;
  power?: string;
  description?: string;
}

test.describe('Mythology API - Mocking & Patching', () => {
  test.describe.configure({ mode: 'serial' });

  test('Should patch Mythology response by adding a synthetic Mocked Hero', async ({ page }) => {
    /**
     * FIX: Use the actual URL pattern. 
     * If your BASE_URL has /api/ but the endpoint doesn't, we strip it.
     */
    const baseUrl = env.baseUrl?.replace(/\/api\/?$/, '') || 'https://api.qasandbox.ru';
    const targetUrl = `${baseUrl}/mythology`;
    const mockedHero: MythologyEntity = {
      id: 777,
      name: 'Mocked Hero',
      power: 'Playwright Patching',
      description: 'Synthetic entity injected via route.fetch() patching technique'
    };

    await test.step('Set up request interception and patching', async () => {
      // Use a glob pattern to be safe
      await page.route('**/mythology', async (route) => {
        await test.info().attach('Original Request', {
          body: `Method: ${route.request().method()}\nURL: ${route.request().url()}`,
          contentType: 'text/plain'
        });

        const response = await route.fetch();
        
        let json: MythologyEntity[];
        try {
          json = await response.json();
        } catch (e) {
          console.log('Backend returned non-JSON response, using empty array for mock');
          json = [];
        }

        const patchedJson: MythologyEntity[] = Array.isArray(json) ? [...json] : [];
        patchedJson.push(mockedHero);

        await test.info().attach('Final Patched Response Body', {
          body: JSON.stringify(patchedJson, null, 2),
          contentType: 'application/json'
        });

        await route.fulfill({
          response,
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(patchedJson),
        });
      });
    });

    await test.step('Navigate and trigger browser-side fetch', async () => {
      // Go to the base site
      await page.goto(baseUrl); 

      // Execute fetch inside the browser
      const result = await page.evaluate(async (url) => {
        const resp = await fetch(url, {
          headers: { 'Accept': 'application/json' }
        });
        if (!resp.ok) {
            // This will show up in your terminal if it fails
            throw new Error(`Browser fetch failed! URL: ${url} | Status: ${resp.status}`);
        }
        return await resp.json() as MythologyEntity[];
      }, targetUrl);

      const heroNames = result.map((hero) => hero.name);
      console.log('Final hero names detected in browser:', heroNames);
      
      expect(heroNames).toContain(mockedHero.name);
    });

    await page.unroute('**/mythology');
  });
});