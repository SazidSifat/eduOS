import { useNavigate } from '@tanstack/react-router';
import { Button } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { classes, roster } from '../../_component/demo-data';
import {
  DataTable,
  DemoLink,
  Details,
  Notice,
  PageHeading,
  Panel,
  Status,
} from '../../_component/demo-ui';
import { currentRegister, markCounts } from './attendance-model';

export function AttendanceReview({
  submitted = false,
  offline = false,
}: {
  submitted?: boolean;
  offline?: boolean;
}) {
  const { state, dispatch, notify } = useDemo();
  const navigate = useNavigate();
  const register = currentRegister(state);
  if (!register) return null;
  const counts = markCounts(register);
  const complete = counts.Unmarked === 0;
  const saved = submitted && register.submitted;
  return (
    <>
      <PageHeading
        title={
          offline ? 'Connection unavailable' : saved ? 'Attendance submitted' : 'Review register'
        }
        description={`${classes.find((c) => c.id === register.classId)?.label} · ${register.date} · Farhana Akter`}
      />
      {offline ? (
        <Notice title="Register not submitted" tone="danger">
          The example connection was interrupted. Keep the screen open and retry; the selections
          below are still in memory.
        </Notice>
      ) : saved ? (
        <Notice title="Register saved successfully" tone="success">
          Original submission · Submitted by Farhana Akter. Later changes use a correction request.
        </Notice>
      ) : (
        <Notice
          title={complete ? 'Ready to submit' : `${counts.Unmarked} students need a status`}
          tone={complete ? 'info' : 'warning'}
        >
          {complete
            ? 'Check absent and late students before confirming this class register.'
            : 'Return to marking before submitting. No partial register will be published.'}
        </Notice>
      )}
      <Panel title="Submission summary">
        <Details
          items={[
            ['Roster', `${roster(register.classId).length} students`],
            ['Present', counts.Present],
            ['Absent', counts.Absent],
            ['Late', counts.Late],
            ['Unmarked', counts.Unmarked],
            ['Submitted by', saved ? 'Farhana Akter' : 'Not submitted'],
          ]}
        />
      </Panel>
      <Panel title={saved ? 'Submitted class register' : 'Absent and late students'}>
        <DataTable caption="Attendance review" headers={['Roll / student', 'Status']}>
          {roster(register.classId)
            .filter((s) => saved || ['Absent', 'Late'].includes(register.marks[s.id] ?? ''))
            .map((s) => (
              <tr key={s.id}>
                <td>
                  {s.roll} · {s.name}
                </td>
                <td>
                  <Status
                    tone={
                      register.marks[s.id] === 'Absent'
                        ? 'danger'
                        : register.marks[s.id] === 'Late'
                          ? 'warning'
                          : 'success'
                    }
                  >
                    {register.marks[s.id]}
                  </Status>
                </td>
              </tr>
            ))}
        </DataTable>
      </Panel>
      <div className="demo-actions demo-print-hide">
        {saved ? (
          <>
            <DemoLink to="/attendance/corrections">Request correction</DemoLink>
            <DemoLink to="/attendance/classes" primary>
              Back to my classes
            </DemoLink>
          </>
        ) : (
          <>
            <DemoLink to="/attendance">Return to marking</DemoLink>
            <Button
              disabled={!complete || register.submitted}
              onClick={() => {
                dispatch({ type: 'attendance-submit' });
                notify('Class attendance submitted in demo data.');
                void navigate({ to: '/attendance/submitted' });
              }}
            >
              {offline ? 'Retry submission' : 'Submit attendance'}
            </Button>
          </>
        )}
      </div>
      {!saved && !offline && (
        <div className="demo-actions">
          <DemoLink to="/attendance/offline">View connection recovery state</DemoLink>
        </div>
      )}
    </>
  );
}
