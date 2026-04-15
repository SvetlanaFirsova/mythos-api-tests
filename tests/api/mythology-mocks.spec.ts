import { test, expect } from '@playwright/test';

test.describe('Mythology API - Mocking & Patching', () => {
  
  test('Should patch Mythology response by adding a Mocked Hero', async ({ page }) => {
    //Define the specific API endpoint to intercept
    const targetUrl = 'https://api.qasandbox.ru/mythology';

    //Set up request interception
    await page.route(targetUrl, async (route) => {
      //Fetch the real response from the actual backend
      const response = await route.fetch();
      
      let json: any[];
      try {
        //Attempt to parse JSON from the response
        json = await response.json();
      } catch (e) {
        //If the backend returns HTML or an error, fallback to an empty array
        console.log('Backend returned non-JSON response, using empty array for mock');
        json = [];
      }

      //Ensure we are working with an array of entities
      const patchedJson = Array.isArray(json) ? [...json] : [];

      //Add our synthetic "Mocked Hero" entity
      patchedJson.push({
        id: 777,
        name: 'Mocked Hero',
        power: 'Playwright Mocking',
        description: 'Synthetic entity injected via page.route()'
      });

      //Attach the patched data to the Allure report
      await test.info().attach('Patched JSON Result', {
        body: JSON.stringify(patchedJson, null, 2),
        contentType: 'application/json'
      });

      //Fulfill the route with the modified body and a forced 200 OK status
      await route.fulfill({
        response,
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(patchedJson),
      });
    });

    //Navigate to the main page to establish a stable browser context
    await page.goto('https://api.qasandbox.ru/'); 

    //Execute the fetch request inside the browser context
    const result = await page.evaluate(async (url) => {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Browser fetch failed with status: ${resp.status}`);
      return await resp.json() as any[];
    }, targetUrl);

    //Extract names and assert the presence of our injected hero
    const heroNames = result.map((hero: any) => hero.name);
    console.log('Final hero names detected in browser:', heroNames);
    
    expect(heroNames).toContain('Mocked Hero');
  });
});