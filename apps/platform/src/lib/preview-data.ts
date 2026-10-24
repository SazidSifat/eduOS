import { platformInstitutionsSchema, platformOperatorSchema } from '@eduos/contracts';
import { z } from 'zod';

export type PreviewInstitution = z.infer<typeof platformInstitutionsSchema>['items'][number];
const operatorPreviewSchema = platformOperatorSchema.extend({ name: z.string(), email: z.email() });
export type PreviewOperator = z.infer<typeof operatorPreviewSchema>;

// Synthetic preview records. This app does not load customer or operator data.
export const institutions = platformInstitutionsSchema.parse({
  limit: 8,
  offset: 0,
  items: [
    {
      id: '10000000-0000-4000-8000-000000000001',
      name: 'Meghna Model School',
      slug: 'meghna-model-school',
      timezone: 'Asia/Dhaka',
    },
    {
      id: '10000000-0000-4000-8000-000000000002',
      name: 'Shapla Academic School',
      slug: 'shapla-academic-school',
      timezone: 'Asia/Dhaka',
    },
    {
      id: '10000000-0000-4000-8000-000000000003',
      name: 'Uttara Learning School',
      slug: 'uttara-learning-school',
      timezone: 'Asia/Dhaka',
    },
    {
      id: '10000000-0000-4000-8000-000000000004',
      name: 'Padma Preparatory School',
      slug: 'padma-preparatory-school',
      timezone: 'Asia/Dhaka',
    },
    {
      id: '10000000-0000-4000-8000-000000000005',
      name: 'Bokul English School',
      slug: 'bokul-english-school',
      timezone: 'Asia/Dhaka',
    },
    {
      id: '10000000-0000-4000-8000-000000000006',
      name: 'Surma Model Academy',
      slug: 'surma-model-academy',
      timezone: 'Asia/Dhaka',
    },
    {
      id: '10000000-0000-4000-8000-000000000007',
      name: 'Rupsha Community School',
      slug: 'rupsha-community-school',
      timezone: 'Asia/Dhaka',
    },
    {
      id: '10000000-0000-4000-8000-000000000008',
      name: 'Karatoa Learning Academy',
      slug: 'karatoa-learning-academy',
      timezone: 'Asia/Dhaka',
    },
  ],
}).items;

export const operators = z.array(operatorPreviewSchema).parse([
  {
    userId: '20000000-0000-4000-8000-000000000001',
    name: 'Ayesha Mahmud',
    email: 'ayesha@example.test',
    role: 'platform_owner',
    active: true,
  },
  {
    userId: '20000000-0000-4000-8000-000000000002',
    name: 'Rafiq Hasan',
    email: 'rafiq@example.test',
    role: 'platform_owner',
    active: true,
  },
  {
    userId: '20000000-0000-4000-8000-000000000003',
    name: 'Nadia Chowdhury',
    email: 'nadia@example.test',
    role: 'platform_manager',
    active: true,
  },
  {
    userId: '20000000-0000-4000-8000-000000000004',
    name: 'Sajid Rahman',
    email: 'sajid@example.test',
    role: 'platform_manager',
    active: true,
  },
  {
    userId: '20000000-0000-4000-8000-000000000005',
    name: 'Farhana Akter',
    email: 'farhana@example.test',
    role: 'platform_manager',
    active: false,
  },
]);

export const institutionIdSchema = z.uuid();
export const directorySearchSchema = z.string().max(200);
