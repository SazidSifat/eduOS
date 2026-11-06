import { messages } from './messages.js';
import { common } from './common.js';
import { admissions } from './admissions.js';
import { attendance } from './attendance.js';
import { finance } from './finance.js';
import { routine } from './routine.js';
import { settings } from './settings.js';
export const bangla: Record<string, string> = {
  ...common,
  ...messages,
  ...admissions,
  ...attendance,
  ...finance,
  ...routine,
  ...settings,
};
