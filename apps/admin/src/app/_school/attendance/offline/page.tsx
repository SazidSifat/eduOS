import { useSyncExternalStore } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AttendanceReview } from '../_component/attendance-review';

function subscribeConnection(listener: () => void) {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
}
function Page() {
  const online = useSyncExternalStore(
    subscribeConnection,
    () => navigator.onLine,
    () => true,
  );
  return <AttendanceReview offline={!online} />;
}

export const Route = createFileRoute('/_school/attendance/offline/')({ component: Page });
