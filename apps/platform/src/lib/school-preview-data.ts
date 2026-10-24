import { institutions } from './preview-data.js';
import {
  subscriptionSchema,
  type SchoolPreviewState,
  type SchoolStatus,
} from './school-preview-model.js';

export function initialSchoolPreview(): SchoolPreviewState {
  const contacts = [
    'Tahmina Akter',
    'Arif Hossain',
    'Rehana Sultana',
    'Imran Kabir',
    'Mita Rahman',
    'Faisal Ahmed',
    'Nasima Islam',
    'Anis Chowdhury',
  ];
  const schools = institutions.map((school, index) => {
    const status: SchoolStatus = index === 5 ? 'frozen' : index === 6 ? 'inactive' : 'active';
    return {
      ...school,
      contactName: contacts[index] ?? 'School Office',
      contactEmail: `office@${school.slug}.example.test`,
      status,
      statusReason:
        status === 'frozen'
          ? 'Access review requested by the school office.'
          : status === 'inactive'
            ? 'School onboarding is paused.'
            : '',
      subscription: subscriptionSchema.parse({
        plan: index % 3 === 0 ? 'plus' : 'essentials',
        billingCycle: index === 3 ? 'annual' : 'monthly',
        status:
          index === 5 ? 'overdue' : index === 6 ? 'cancelled' : index === 7 ? 'trial' : 'active',
        amount: index === 3 ? 36000 : index % 3 === 0 ? 3500 : 1800,
        renewalDate: index === 5 ? '2026-10-20' : '2026-11-01',
      }),
    };
  });
  return { schools, messages: [], events: [] };
}
