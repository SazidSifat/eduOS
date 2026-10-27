import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, DatePicker, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { classes, DEMO_TODAY, roster } from '../../_component/demo-data';
import { DemoLink, PageHeading, Panel, Status } from '../../_component/demo-ui';
import { markCounts } from './attendance-model';

export function AttendanceClasses() {
  const { state, dispatch } = useDemo();
  const navigate = useNavigate();
  const [date, setDate] = useState(DEMO_TODAY);
  return (
    <div className="demo-stack demo-width-phone">
      <PageHeading title="My classes" description={`Farhana Akter · ${date} · Session 2026`} />
      <div className="demo-field">
        <Label htmlFor="my-class-date">Attendance date</Label>
        <DatePicker id="my-class-date" value={date} onValueChange={setDate} />
      </div>
      {classes.map((c) => {
        const register = state.registers.find((r) => r.classId === c.id && r.date === date);
        const marked = register ? c.count - markCounts(register).Unmarked : 0;
        return (
          <Panel
            key={c.id}
            title={c.label}
            description={`${roster(c.id).length} enrolled students`}
          >
            <div className="mb-5">
              <Status tone={register?.submitted ? 'success' : marked ? 'warning' : 'neutral'}>
                {register?.submitted
                  ? 'Submitted'
                  : marked
                    ? `Draft · ${marked} of ${c.count} marked`
                    : 'Not started'}
              </Status>
            </div>
            <Button
              className="w-full"
              variant={c.id === '3-a' ? 'default' : 'outline'}
              onClick={() => {
                dispatch({ type: 'register-select', date, classId: c.id });
                void navigate({
                  to: register?.submitted ? '/attendance/submitted' : '/attendance',
                });
              }}
            >
              Open register
            </Button>
          </Panel>
        );
      })}
      <DemoLink to="/attendance/history">View attendance history</DemoLink>
    </div>
  );
}
