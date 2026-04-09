import { expect, test } from '@playwright/test';

import { getMythologyById, getMythologyList, type MythologyEntity } from '../../src/api/mythology';
import {
  mythologyCategories,
  notFoundMythologyEntityId,
} from '../support/mythology-test-data';

test('GET /mythology returns successful JSON response', async ({ request }) => {
  const response = await getMythologyList(request);

  await expect(response).toBeOK();
  expect(response.headers()['content-type']).toContain('application/json');

  const body = (await response.json()) as MythologyEntity[];

  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeGreaterThan(0);
});

for (const category of mythologyCategories) {
  test(`GET /mythology?category=${category} returns only ${category}`, async ({ request }) => {
    const response = await getMythologyList(request, { category });

    await expect(response).toBeOK();

    const body = (await response.json()) as MythologyEntity[];

    expect(Array.isArray(body)).toBe(true);

    for (const entity of body) {
      expect(entity.category).toBe(category);
    }
  });
}

test('GET /mythology?sort=asc and sort=desc return the same entities in opposite order', async ({
  request,
}) => {
  const ascResponse = await getMythologyList(request, { sort: 'asc' });
  const descResponse = await getMythologyList(request, { sort: 'desc' });

  await expect(ascResponse).toBeOK();
  await expect(descResponse).toBeOK();

  const ascEntities = (await ascResponse.json()) as MythologyEntity[];
  const descEntities = (await descResponse.json()) as MythologyEntity[];

  expect(ascEntities.length).toBe(descEntities.length);

  const ascIds = ascEntities.map((entity) => entity.id).sort((left, right) => left - right);
  const descIds = descEntities.map((entity) => entity.id).sort((left, right) => left - right);

  expect(ascIds).toEqual(descIds);

  const ascNames = ascEntities.map((entity) => entity.name);
  const descNames = descEntities.map((entity) => entity.name);

  expect(ascNames).not.toEqual(descNames);
  expect(ascNames.slice(0, 10)).toEqual(descNames.slice(-10).reverse());
});

test('GET /mythology/{id} returns an existing entity', async ({ request }) => {
  const listResponse = await getMythologyList(request);
  await expect(listResponse).toBeOK();

  const entities = (await listResponse.json()) as MythologyEntity[];
  expect(entities.length).toBeGreaterThan(0);
  const existingEntity = entities[0] as MythologyEntity;

  const response = await getMythologyById(request, existingEntity.id);

  await expect(response).toBeOK();

  const entity = (await response.json()) as MythologyEntity;

  expect(entity.id).toBe(existingEntity.id);
  expect(entity.name).toBe(existingEntity.name);
  expect(entity.category).toBe(existingEntity.category);
  expect(entity.desc).toBe(existingEntity.desc);
});

test('GET /mythology/{id} returns 404 for a non-existent entity', async ({ request }) => {
  const response = await getMythologyById(request, notFoundMythologyEntityId);

  expect(response.status()).toBe(404);
});
