import { createContext, useContext, useState, type ReactNode } from 'react';
import { usePreview } from './preview-provider';
import { initialSchoolPreview } from '../../lib/school-preview-data';
import {
  createSchoolPreview,
  changeSchoolStatusPreview,
  updateSubscriptionPreview,
  prepareSchoolMessagePreview,
} from '../../lib/school-preview-actions';
import type { SchoolPreviewState } from '../../lib/school-preview-model';

type SchoolPreviewContext = SchoolPreviewState & {
  createSchool: (input: unknown) => string;
  changeSchoolStatus: (id: string, input: unknown) => void;
  updateSubscription: (id: string, input: unknown) => void;
  prepareMessage: (input: unknown) => void;
};
const Context = createContext<SchoolPreviewContext | null>(null);
export function SchoolPreviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialSchoolPreview);
  const { role } = usePreview();
  const value: SchoolPreviewContext = {
    ...state,
    createSchool: (input) => {
      const result = createSchoolPreview(state, role, input);
      setState(result.state);
      return result.id;
    },
    changeSchoolStatus: (id, input) => setState(changeSchoolStatusPreview(state, role, id, input)),
    updateSubscription: (id, input) => setState(updateSubscriptionPreview(state, role, id, input)),
    prepareMessage: (input) => setState(prepareSchoolMessagePreview(state, role, input)),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useSchoolPreview() {
  const context = useContext(Context);
  if (!context) throw new Error('SchoolPreviewProvider is required.');
  return context;
}
