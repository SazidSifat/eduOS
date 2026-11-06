import { useLanguage } from '@eduos/ui';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, DatePicker, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DEMO_TODAY } from '../../_component/school-format';
import { DemoLink, PageHeading, Panel, Status } from '../../_component/demo-ui';
import { markCounts } from './attendance-model';

export function AttendanceClasses() {
  const { t } = useLanguage();

  const { state, dispatch, classes, roster, snapshot } = useDemo();
  const navigate = useNavigate();
  const [date, setDate] = useState(DEMO_TODAY);
  return (
    <div className="demo-stack demo-width-phone">
      <PageHeading title={t('My classes')} description={`${snapshot.identity.name} · ${date}`} />
      <div className="demo-field">
        <Label htmlFor="my-class-date">{t('Attendance date')}</Label>
        <DatePicker
          id="my-class-date"
          value={date}
          onValueChange={(value) => {
            if (value) setDate(value);
          }}
        />
      </div>
      {classes.map((c) => {
        const register = state.registers.find((r) => r.classId === c.id && r.date === date);
        const count = roster(c.id, date).length;
        const marked = register
          ? Object.keys(register.marks).length - markCounts(register).Unmarked
          : 0;
        return (
          <Panel
            key={c.id}
            title={c.label}
            description={t('{value0} enrolled students', { value0: count })}
          >
            <div className="mb-5">
              <Status tone={register?.submitted ? 'success' : marked ? 'warning' : 'neutral'}>
                {register?.submitted
                  ? t('Submitted')
                  : marked
                    ? t('Draft · {value0} of {value1} marked', { value0: marked, value1: count })
                    : t('Not started')}
              </Status>
            </div>
            <Button
              className="w-full"
              variant={c.id === '' ? 'default' : 'outline'}
              onClick={async () => {
                if (!(await dispatch({ type: 'register-select', date, classId: c.id }))) return;
                void navigate({
                  to: register?.submitted ? '/attendance/submitted' : '/attendance',
                });
              }}
            >
              {t('Open register')}{' '}
            </Button>
          </Panel>
        );
      })}
      <DemoLink to="/attendance/history">{t('View attendance history')}</DemoLink>
    </div>
  );
}
