import { useNavigate } from '@tanstack/react-router';
import { Button } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';

import {
  EmptyState,
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
  const { state, dispatch, notify, classes, roster, snapshot } = useDemo();
  const navigate = useNavigate();
  const register = currentRegister(state);
  if (!register)
    return (
      <EmptyState title="No class register available">
        Configure an academic offering and class teacher, then enroll students to start attendance.
      </EmptyState>
    );
  const counts = markCounts(register);
  const hasStudents = Object.keys(register.marks).length > 0;
  const complete = hasStudents && counts.Unmarked === 0;
  const saved = submitted && register.submitted;
  return (
    <>
      <PageHeading
        title={
          offline ? 'Connection unavailable' : saved ? 'Attendance submitted' : 'Review register'
        }
        description={`${classes.find((c) => c.id === register.classId)?.label} · ${register.date} · ${snapshot.identity.name}`}
      />
      {offline ? (
        <Notice title="Register not submitted" tone="danger">
          The connection is unavailable. Keep the screen open and retry; the selections below remain
          on this screen until you leave or reload.
        </Notice>
      ) : saved ? (
        <Notice title="Register saved successfully" tone="success">
          Original submission is preserved in the school record. Later changes use a correction
          request.
        </Notice>
      ) : (
        <Notice
          title={
            !hasStudents
              ? 'No enrolled students on this date'
              : complete
                ? 'Ready to submit'
                : `${counts.Unmarked} students need a status`
          }
          tone={complete ? 'info' : 'warning'}
        >
          {!hasStudents
            ? 'Choose a date when students are enrolled in this class.'
            : complete
              ? 'Check absent and late students before confirming this class register.'
              : 'Return to marking before submitting. No partial register will be published.'}
        </Notice>
      )}
      <Panel title="Submission summary">
        <Details
          items={[
            ['Roster', `${roster(register.classId, register.date).length} students`],
            ['Present', counts.Present],
            ['Absent', counts.Absent],
            ['Late', counts.Late],
            ['Unmarked', counts.Unmarked],
            ['Submitted by', saved ? 'See submission history' : 'Not submitted'],
          ]}
        />
      </Panel>
      <Panel title={saved ? 'Submitted class register' : 'Absent and late students'}>
        <DataTable caption="Attendance review" headers={['Roll / student', 'Status']}>
          {roster(register.classId, register.date)
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
              onClick={async () => {
                if (!(await dispatch({ type: 'attendance-submit' }))) return;
                notify('Class attendance submitted.');
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
          <DemoLink to="/attendance/offline">Connection status and retry</DemoLink>
        </div>
      )}
    </>
  );
}
