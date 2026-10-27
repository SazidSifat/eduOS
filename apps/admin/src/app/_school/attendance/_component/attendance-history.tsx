import { useNavigate } from '@tanstack/react-router';
import { Button } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { classes } from '../../_component/demo-data';
import { DemoLink, Details, PageHeading, Panel, Status } from '../../_component/demo-ui';
import { markCounts } from './attendance-model';

export function AttendanceHistory() {
  const { state, dispatch } = useDemo();
  const navigate = useNavigate();
  const registers = state.registers
    .filter((r) => r.submitted)
    .toSorted((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="demo-stack demo-width-phone">
      <PageHeading
        title="Attendance history"
        description="Submitted registers and correction requests for the sample class assignments."
      />
      {registers.map((r) => {
        const counts = markCounts(r);
        return (
          <Panel key={r.id} title={`${classes.find((c) => c.id === r.classId)?.label} · ${r.date}`}>
            <Status tone="success">Submitted</Status>
            <div className="my-5">
              <Details
                items={[
                  ['Present', counts.Present],
                  ['Absent', counts.Absent],
                  ['Late', counts.Late],
                  ['Submitted by', 'Farhana Akter'],
                ]}
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                dispatch({ type: 'register-select', date: r.date, classId: r.classId });
                void navigate({ to: '/attendance/submitted' });
              }}
            >
              View register
            </Button>
          </Panel>
        );
      })}
      <DemoLink to="/attendance/corrections" primary>
        History & correction request
      </DemoLink>
      <DemoLink to="/attendance/classes">Back to my classes</DemoLink>
    </div>
  );
}
