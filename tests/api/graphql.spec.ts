import { test, expect } from '@playwright/test';

test.describe('GraphQL API - Negative Tests', () => {

  test('Should return authorization error when creating a soul without a JWT token', async ({ request }) => {
    //Define mutation without 'location' as it's not supported by the schema
    const createSoulMutation = {
      query: `
        mutation CreateSoul($input: SoulInput!) {
          createSoul(input: $input) {
            id
            name
          }
        }
      `,
      variables: {
        input: {
          name: "Unauthorized Soul"
        }
      }
    };

    /**
     * Send request to the absolute GraphQL URL.
     * We use a full URL to bypass the '/api/' prefix from playwright.config.ts
     */
    const response = await request.post('https://api.qasandbox.ru/graphql', {
      data: createSoulMutation
    });

    //Ensure we received a JSON response before parsing
    const contentType = response.headers()['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      const textBody = await response.text();
      await test.info().attach('Server Non-JSON Response', { body: textBody, contentType: 'text/html' });
      throw new Error(`Expected JSON but got ${contentType}. Possible 404 or Server Error.`);
    }

    const body = await response.json();

    //Attach the full response to Allure for transparency
    await test.info().attach('GraphQL Error Response', {
      body: JSON.stringify(body, null, 2),
      contentType: 'application/json'
    });

    /**
     * Assertions
     * In GraphQL, unauthorized requests usually return 200 OK but with an 'errors' array.
     */
    expect(body.errors, 'GraphQL response should contain errors').toBeDefined();
    expect(body.errors.length).toBeGreaterThan(0);

    //According to GraphQL spec, the failed field should be null
    expect(body.data?.createSoul, 'The createSoul field should be null or missing').toBeFalsy();

    //Validate the error message (Handling English and Russian localization)
    const errorMessage = body.errors[0].message.toLowerCase();
    console.log('Detected GraphQL Error Message:', errorMessage);
    
    const authKeywords = [
      'unauthorized', 
      'authorization', 
      'token', 
      'authenticated', 
      'forbidden', 
      'denied',
      'авторизов', //Matches "только авторизованные жрецы..."
      'жрецы',
      'призывать'
    ];
    
    const hasAuthError = authKeywords.some(keyword => errorMessage.includes(keyword));
    
    expect(hasAuthError, `Expected an auth error keyword, but got: "${errorMessage}"`).toBeTruthy();
  });
});