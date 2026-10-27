import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { DemoAction, DemoState } from './demo-model';
import { initialState } from './demo-data';
import { demoReducer } from './demo-reducer';

export interface FeeDraft {
  candidateId: string;
  allocations: { chargeId: string; amount: number }[];
  date: string;
  note: string;
}
interface DemoContextValue {
  state: DemoState;
  dispatch: Dispatch<DemoAction>;
  message: string;
  notify: (message: string) => void;
  feeDraft: FeeDraft | null;
  setFeeDraft: (draft: FeeDraft | null) => void;
}
const DemoContext = createContext<DemoContextValue | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatchState] = useReducer(demoReducer, undefined, initialState);
  const [feeDraft, setFeeDraft] = useState<FeeDraft | null>(null);
  const dispatch = useCallback((action: DemoAction) => {
    if (action.type === 'reset') setFeeDraft(null);
    dispatchState(action);
  }, []);
  const [message, setMessage] = useState('');
  const notify = useCallback((value: string) => setMessage(value), []);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 6000);
    return () => window.clearTimeout(timer);
  }, [message]);
  return (
    <DemoContext value={{ state, dispatch, message, notify, feeDraft, setFeeDraft }}>
      {children}
    </DemoContext>
  );
}
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('Demo workspace context is unavailable');
  return context;
}
