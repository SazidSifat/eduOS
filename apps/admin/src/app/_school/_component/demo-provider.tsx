import { useLanguage } from '@eduos/ui';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { schoolActionSchema, type SchoolSnapshot, type SchoolRegister } from '@eduos/contracts';
import { Button } from '@eduos/ui';
import type { DemoAction, DemoState } from './demo-model';
import { schoolCommand, schoolQuery } from '../_api/queries';
import { queryClient } from '../../../lib/query-client';
import { ApiError } from '../../../lib/api-client';
import { useSchoolUiStore, type FeeAllocationDraft } from '../../../stores/school-ui-store';
import { datedRoster, reconcileDraftRoster } from '../attendance/_component/dated-roster';

export type FeeDraft = FeeAllocationDraft;
interface DemoContextValue {
  state: DemoState;
  snapshot: SchoolSnapshot;
  dispatch: (action: DemoAction) => Promise<{ id?: string } | null>;
  busy: boolean;
  message: string;
  notify: (message: string) => void;
  feeDraft: FeeDraft | null;
  setFeeDraft: (draft: FeeDraft | null) => void;
  classes: SchoolSnapshot['classes'];
  roster: (classId: string, date?: string) => SchoolSnapshot['students'];
}
const DemoContext = createContext<DemoContextValue | null>(null);
const route = getRouteApi('/_school');
export function DemoProvider({ children }: { children: ReactNode }) {
  const context = route.useRouteContext();
  return (
    <SchoolProvider
      key={`${context.identity.id}:${context.institutionId}`}
      userId={context.identity.id}
      institutionId={context.institutionId}
    >
      {children}
    </SchoolProvider>
  );
}
function SchoolProvider({
  userId,
  institutionId,
  children,
}: {
  userId: string;
  institutionId: string;
  children: ReactNode;
}) {
  const { t } = useLanguage();

  const query = schoolQuery(userId, institutionId);
  const result = useQuery(query);
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof schoolCommand>[1]) => schoolCommand(institutionId, input),
  });
  const [selected, setSelected] = useState<{ classId: string; date: string } | null>(null);
  const [draft, setDraft] = useState<SchoolRegister | null>(null);
  const feeDraft = useSchoolUiStore((s) => s.feeDraft);
  const setFeeDraft = useSchoolUiStore((s) => s.setFeeDraft);
  const message = useSchoolUiStore((s) => s.notificationMessage);
  const saving = useRef(false);
  const retry = useRef<{ signature: string; key: string } | null>(null);
  const notify = useCallback((value: string) => {
    useSchoolUiStore.getState().setNotification(value);
  }, []);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => useSchoolUiStore.getState().clearNotification(), 8000);
    return () => window.clearTimeout(timer);
  }, [message]);
  if (
    !result.data ||
    (result.error instanceof ApiError && [401, 403].includes(result.error.status))
  )
    return (
      <section role={result.isError ? 'alert' : 'status'} className="p-6">
        <p>
          {result.isError
            ? t('School data could not be loaded. Check access and API connectivity.')
            : t('Loading school records…')}
        </p>
        {result.isError && <Button onClick={() => void result.refetch()}>{t('Retry')}</Button>}
      </section>
    );
  const snapshot = result.data;
  const selection =
    selected ??
    (snapshot.classes[0] ? { classId: snapshot.classes[0].id, date: snapshot.today } : null);
  const registerId = selection ? `${selection.date}|${selection.classId}` : '';
  const saved = snapshot.state.registers.find((r) => r.id === registerId);
  const baseRegister: SchoolRegister | null = !selection
    ? null
    : draft?.id === registerId
      ? draft
      : (saved ?? {
          id: registerId,
          ...selection,
          marks: Object.fromEntries(
            datedRoster(snapshot.students, selection.classId, selection.date).map((s) => [
              s.id,
              'Unmarked',
            ]),
          ),
          submitted: false,
          saved: false,
        });
  const current = baseRegister ? reconcileDraftRoster(baseRegister, snapshot.students) : null;
  const state = {
    ...snapshot.state,
    selectedRegister: registerId,
    registers: current
      ? [...snapshot.state.registers.filter((r) => r.id !== registerId), current]
      : snapshot.state.registers,
  };
  async function dispatch(action: DemoAction): Promise<{ id?: string } | null> {
    if (action.type === 'register-select') {
      setSelected({ classId: action.classId, date: action.date });
      setDraft(null);
      return {};
    }
    if (action.type === 'attendance-mark' || action.type === 'attendance-bulk') {
      if (!current || current.submitted) return null;
      setDraft((prior) => {
        const r = prior?.id === current.id ? prior : current;
        if (action.type === 'attendance-mark')
          return { ...r, saved: false, marks: { ...r.marks, [action.studentId]: action.mark } };
        return {
          ...r,
          saved: false,
          marks: Object.fromEntries(
            Object.entries(r.marks).map(([id, mark]) => [
              id,
              mark === 'Unmarked' ? 'Present' : mark,
            ]),
          ),
        };
      });
      return {};
    }
    if (saving.current) {
      notify('Wait for the current save to finish.');
      return null;
    }
    const raw =
      action.type === 'attendance-save' || action.type === 'attendance-submit'
        ? current
          ? {
              type: 'attendance-save',
              classId: current.classId,
              date: current.date,
              marks: current.marks,
              submit: action.type === 'attendance-submit',
            }
          : null
        : action;
    const parsed = schoolActionSchema.safeParse(raw);
    if (!parsed.success) {
      notify(parsed.error.issues[0]?.message ?? 'Review this action.');
      return null;
    }
    saving.current = true;
    try {
      const signature = JSON.stringify(parsed.data);
      const operationKey =
        retry.current?.signature === signature ? retry.current.key : crypto.randomUUID();
      retry.current = { signature, key: operationKey };
      const latest = queryClient.getQueryData(query.queryKey) ?? snapshot;
      const response = await mutation.mutateAsync({
        operationKey,
        revision: latest.revision,
        action: parsed.data,
      });
      retry.current = null;
      if (action.type === 'attendance-save' || action.type === 'attendance-submit') setDraft(null);
      await queryClient.invalidateQueries({ queryKey: query.queryKey });
      return response.id ? { id: response.id } : {};
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        retry.current = null;
        void queryClient.invalidateQueries({ queryKey: query.queryKey });
        notify(
          'The record changed or this transition is no longer allowed. Review the latest data and retry.',
        );
      } else if (
        error instanceof ApiError &&
        error.status === 400 &&
        error.code !== 'VALIDATION_ERROR'
      ) {
        notify(error.message);
      } else
        notify(
          error instanceof ApiError && error.status === 403
            ? 'Your current school role or module access does not allow this action.'
            : 'The save failed. Your input is retained; check the fields and connection, then retry.',
        );
      return null;
    } finally {
      saving.current = false;
    }
  }
  return (
    <DemoContext
      value={{
        state,
        snapshot,
        dispatch,
        busy: mutation.isPending,
        message,
        notify,
        feeDraft,
        setFeeDraft,
        classes: snapshot.classes,
        roster: (classId, date) =>
          datedRoster(
            snapshot.students,
            classId,
            date,
            date
              ? snapshot.state.registers.find((r) => r.classId === classId && r.date === date)
              : undefined,
          ),
      }}
    >
      {children}
    </DemoContext>
  );
}
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('School workspace context is unavailable');
  return context;
}
