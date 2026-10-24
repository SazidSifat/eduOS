import { GraduationCap } from 'lucide-react';

export function AppBrand() {
  return (
    <span className="inline-flex items-center gap-2.5 text-base font-semibold tracking-tight">
      <GraduationCap aria-hidden="true" className="size-6 text-primary" strokeWidth={1.5} />
      EduOS
    </span>
  );
}
