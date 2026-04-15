import { test, expect } from '@playwright/test';

test.describe('GraphQL API - Negative Tests', () => {

  test('Should return authorization error when creating a soul without a JWT token', async ({ request }) => {
    //Define mutation with the correct SoulInput type
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
          name: "Unauthorized Soul",
          location: "Underworld" 
        }
      }
    };

    //Send request WITHOUT the Authorization header
    const response = await request.post('/graphql', {
      data: createSoulMutation
    });

    const body = await response.json();

    //Attach response to Allure for full transparency
    await test.info().attach('GraphQL Error Response', {
      body: JSON.stringify(body, null, 2),
      contentType: 'application/json'
    });

    //Verify that the GraphQL body contains an errors array
    expect(body.errors, 'GraphQL response should contain errors').toBeDefined();
    expect(body.errors.length).toBeGreaterThan(0);

    //Verify that data.createSoul is missing or null
    //According to GraphQL spec, if execution fails, the field should be null
    expect(body.data?.createSoul, 'The createSoul field should be null or missing').toBeFalsy();

    //Assert the error message indicates authorization failure
    const errorMessage = body.errors[0].message.toLowerCase();
    console.log('Detected GraphQL Error Message:', errorMessage);
    
    const authKeywords = ['unauthorized', 'authorization', 'token', 'authenticated', 'forbidden', 'denied'];
    const hasAuthError = authKeywords.some(keyword => errorMessage.includes(keyword));
    
    expect(hasAuthError, `Expected an auth error but got: ${errorMessage}`).toBeTruthy();
  });
});