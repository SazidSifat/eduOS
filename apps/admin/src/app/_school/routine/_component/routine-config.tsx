import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Input, Label } from '@eduos/ui';
import { Plus, Trash2 } from 'lucide-react';
import { useDemo } from '../../_component/demo-provider';
import { DemoForm, valueOf } from '../../_component/demo-form';
import { DemoLink, Notice, PageHeading, Panel } from '../../_component/demo-ui';
import { validPeriods } from './routine-model';

export function RoutineConfig() {
  const { state, dispatch, notify } = useDemo();
  const navigate = useNavigate();
  const [days, setDays] = useState(state.routine.days);
  const [periods, setPeriods] = useState(state.routine.periods.map((p) => ({ ...p })));
  const [error, setError] = useState('');
  return (
    <>
      <PageHeading
        title="Create a class routine"
        description="Choose the class, teaching days and period structure before assigning lessons."
      />
      {error && (
        <Notice title="Review the routine structure" tone="danger">
          {error}
        </Notice>
      )}
      <DemoForm
        sections={[
          {
            title: 'Routine scope',
            fields: [
              {
                name: 'className',
                label: 'Class / section',
                value: state.routine.className,
                options: ['Class 3 · A', 'Class 4 · A', 'Class 5 · B'],
                required: true,
              },
              {
                name: 'session',
                label: 'Academic session',
                value: state.settings.session ?? '2026',
                readOnly: true,
              },
              {
                name: 'effective',
                label: 'Effective from',
                kind: 'date',
                required: true,
                value: state.routine.effective,
              },
            ],
          },
        ]}
        submitLabel="Continue to lesson builder"
        footer={<DemoLink to="/routine">Cancel</DemoLink>}
        onSubmit={(values) => {
          if (!days.length || !validPeriods(periods)) {
            setError(
              'Choose at least one teaching day. Every period needs valid, non-overlapping start and end times.',
            );
            return;
          }
          dispatch({
            type: 'routine-configure',
            days,
            periods,
            effective: valueOf(values, 'effective'),
            className: valueOf(values, 'className'),
          });
          notify('Routine structure saved as a draft.');
          void navigate({ to: '/routine' });
        }}
      >
        <Panel
          title="Teaching days"
          description="The weekly pattern is configurable for the school."
        >
          <div className="flex flex-wrap gap-3">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
              (day) => (
                <label className="demo-check rounded-md border border-border px-3 py-2" key={day}>
                  <input
                    type="checkbox"
                    checked={days.includes(day)}
                    onChange={(e) =>
                      setDays((current) =>
                        e.target.checked ? [...current, day] : current.filter((d) => d !== day),
                      )
                    }
                  />
                  {day}
                </label>
              ),
            )}
          </div>
        </Panel>
        <Panel
          title="Periods and breaks"
          description="Any gap between periods is displayed as a break in the weekly grid."
        >
          <div className="demo-stack">
            {periods.map((period) => (
              <div key={period.id} className="demo-period-form">
                <p className="font-semibold">Period {period.id}</p>
                <div className="demo-field">
                  <Label htmlFor={`period-${period.id}-start`}>Starts</Label>
                  <Input
                    id={`period-${period.id}-start`}
                    type="time"
                    value={period.start}
                    onChange={(e) =>
                      setPeriods((current) =>
                        current.map((p) =>
                          p.id === period.id ? { ...p, start: e.target.value } : p,
                        ),
                      )
                    }
                  />
                </div>
                <div className="demo-field">
                  <Label htmlFor={`period-${period.id}-end`}>Ends</Label>
                  <Input
                    id={`period-${period.id}-end`}
                    type="time"
                    value={period.end}
                    onChange={(e) =>
                      setPeriods((current) =>
                        current.map((p) =>
                          p.id === period.id ? { ...p, end: e.target.value } : p,
                        ),
                      )
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  aria-label={`Remove period ${period.id}`}
                  disabled={periods.length < 2}
                  onClick={() => setPeriods((current) => current.filter((p) => p.id !== period.id))}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <div className="demo-actions">
              <Button
                variant="outline"
                onClick={() => {
                  const last = periods.at(-1);
                  const [h, m] = (last?.end ?? '08:00').split(':').map(Number);
                  const minutes = (h ?? 8) * 60 + (m ?? 0) + 40;
                  setPeriods((current) => [
                    ...current,
                    {
                      id: String(Math.max(...current.map((p) => Number(p.id))) + 1),
                      start: last?.end ?? '08:00',
                      end: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
                    },
                  ]);
                }}
              >
                <Plus size={16} />
                Add period
              </Button>
            </div>
          </div>
        </Panel>
      </DemoForm>
    </>
  );
}
