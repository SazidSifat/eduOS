import { useEffect, useRef, type ComponentProps } from 'react';
import { DayPicker, useDayPicker, type DayButton, type MonthCaption } from 'react-day-picker';
import { Button } from './button.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select.js';
import { cn } from '../lib/utils.js';
import { calendarValue } from '../lib/calendar-date.js';

export function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  ...props
}: ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      fixedWeeks
      hideNavigation
      className={cn('w-full p-3 text-sm', className)}
      classNames={{
        months: 'flex flex-col gap-4',
        month: 'w-full space-y-3',
        month_caption: 'relative',
        caption_label: 'text-sm font-medium',
        month_grid: 'w-full border-collapse',
        weekdays: 'h-8',
        weekday: 'w-9 text-center text-xs font-normal text-muted-foreground',
        day: 'h-9 w-9 p-0 text-center align-middle',
        day_button: 'mx-auto',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-40',
        hidden: 'invisible',
        today: '[&_button]:ring-1 [&_button]:ring-ring',
        selected: '[&_button]:bg-primary [&_button]:text-primary-foreground',
        ...classNames,
      }}
      components={{ MonthCaption: CalendarCaption, DayButton: CalendarDayButton, ...components }}
      {...props}
    />
  );
}
function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: ComponentProps<typeof DayButton>) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  return (
    <Button
      ref={ref}
      variant={modifiers.selected ? 'default' : 'ghost'}
      size="icon"
      data-day={calendarValue(day.date)}
      data-slot="calendar-day"
      className={cn(
        'size-9 rounded-md p-0 font-normal transition-colors duration-150 ease-out motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  );
}
function CalendarCaption({
  calendarMonth,
  displayIndex: _displayIndex,
  children,
  ...props
}: ComponentProps<typeof MonthCaption>) {
  const { goToMonth, nextMonth, previousMonth, dayPickerProps } = useDayPicker();
  const month = calendarMonth.date;
  const first = dayPickerProps.startMonth ?? new Date(1900, 0, 1);
  const last = dayPickerProps.endMonth ?? new Date(2100, 11, 1);
  const years = Array.from(
    { length: last.getFullYear() - first.getFullYear() + 1 },
    (_, index) => first.getFullYear() + index,
  );
  return (
    <div {...props}>
      <div className="sr-only">{children}</div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="Previous month"
          disabled={!previousMonth}
          onClick={() => {
            if (previousMonth) goToMonth(previousMonth);
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="m14 6-6 6 6 6" />
          </svg>
        </Button>
        <Select
          value={String(month.getMonth())}
          onValueChange={(value) => goToMonth(new Date(month.getFullYear(), Number(value), 1))}
        >
          <SelectTrigger aria-label="Month" className="h-8 min-w-0 flex-1 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, index) => {
              const date = new Date(month.getFullYear(), index, 1);
              const outside =
                date < new Date(first.getFullYear(), first.getMonth(), 1) ||
                date > new Date(last.getFullYear(), last.getMonth(), 1);
              return (
                <SelectItem key={index} value={String(index)} disabled={outside}>
                  {new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(date)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Select
          value={String(month.getFullYear())}
          onValueChange={(value) => {
            const requested = new Date(Number(value), month.getMonth(), 1);
            goToMonth(requested < first ? first : requested > last ? last : requested);
          }}
        >
          <SelectTrigger aria-label="Year" className="h-8 w-[84px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="Next month"
          disabled={!nextMonth}
          onClick={() => {
            if (nextMonth) goToMonth(nextMonth);
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="m10 6 6 6-6 6" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
