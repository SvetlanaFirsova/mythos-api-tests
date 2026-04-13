import type {
  CreateMythologyPayload,
  MythologyCategory,
  MythologyEntity,
  MythologySortDirection,
  PatchMythologyPayload,
} from '../../src/api/mythology';

type InvalidCreateMythologyCase = {
  name: string;
  payload: CreateMythologyPayload;
};

const createEntitySuffix = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');

  return `${timestamp}_${randomPart}`;
};

export const mythologyCategories = ['gods', 'heroes', 'creatures'] as const satisfies readonly MythologyCategory[];
export const mythologySortDirections =
  ['asc', 'desc'] as const satisfies readonly MythologySortDirection[];
export const protectedSystemEntityIds = [1, 5, 10, 15, 20, 25, 31] as const;
export const notFoundMythologyEntityId = 999_999_999;

const toRequestCategory = (value: string): MythologyCategory =>
  mythologyCategories.find((category) => category === value) ?? 'heroes';

export const createMythologyPayload = (
  overrides: Partial<CreateMythologyPayload> = {},
): CreateMythologyPayload => ({
  name: `Playwright entity ${createEntitySuffix()}`,
  category: 'heroes',
  desc: 'Created by Playwright API tests.',
  ...overrides,
});

export const createReplacementMythologyPayload = (
  overrides: Partial<CreateMythologyPayload> = {},
): CreateMythologyPayload =>
  createMythologyPayload({
    category: 'gods',
    desc: 'Replaced by Playwright put test.',
    name: `Playwright replacement ${createEntitySuffix()}`,
    ...overrides,
  });

export const createPatchMythologyPayload = (
  overrides: PatchMythologyPayload = {},
): PatchMythologyPayload => ({
  desc: 'Updated by Playwright patch test.',
  ...overrides,
});

export const createIncompletePutPayload = (
  entity: MythologyEntity,
): Pick<CreateMythologyPayload, 'name' | 'category'> => ({
  name: entity.name,
  category: toRequestCategory(entity.category),
});

export const invalidCreateMythologyCases: InvalidCreateMythologyCase[] = [
  {
    name: 'empty name',
    payload: createMythologyPayload({
      desc: 'Missing name should trigger validation error.',
      name: '',
    }),
  },
  //Whitespace-only values
  {
    name: 'whitespace-only name',
    payload: createMythologyPayload({
      name: '   ',
      desc: 'Whitespace-only name should be invalid.',
    }),
  },
  //Invalid category
  {
    name: 'invalid category',
    payload: createMythologyPayload({
      //@ts-ignore: Testing invalid value outside of the type
      category: 'aliens', 
      desc: 'Non-existent category should return 400.',
    }),
  },
  //Excessively long strings (Example: > 1000 chars)
  {
    name: 'excessively long description',
    payload: createMythologyPayload({
      desc: 'a'.repeat(1001), 
    }),
  },
  //Invalid img URL format
  {
    name: 'invalid image URL',
    payload: createMythologyPayload({
      img: 'not-a-url',
    }),
  },
];

