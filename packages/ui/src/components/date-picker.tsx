import { useState, type ComponentProps } from 'react';
import { Button } from './button.js';
import { Calendar } from './calendar.js';
import { Popover, PopoverContent, PopoverTrigger } from './popover.js';
import { calendarDate, calendarValue } from '../lib/calendar-date.js';
import { cn } from '../lib/utils.js';

interface DatePickerProps extends Pick<
  ComponentProps<'button'>,
  'id' | 'ref' | 'disabled' | 'onBlur' | 'aria-describedby' | 'aria-invalid' | 'aria-required'
> {
  value: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  maxDate?: Date;
}
export function DatePicker({
  value,
  onValueChange,
  placeholder = 'Pick a date',
  maxDate,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [today] = useState(() => new Date());
  const selected = calendarDate(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-slot="date-picker"
          className={cn(
            'h-9 w-full justify-between px-3 text-left font-normal',
            !selected && 'text-muted-foreground',
          )}
          {...props}
        >
          <span>
            {selected
              ? new Intl.DateTimeFormat('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }).format(selected)
              : placeholder}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M8 3v4m8-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        aria-label="Choose a date"
        className="w-[min(20rem,calc(100vw-2rem))] p-0"
        onOpenAutoFocus={(event) => {
          const day =
            event.target instanceof HTMLElement
              ? event.target.querySelector<HTMLButtonElement>(
                  'button[data-day][tabindex="0"]:not(:disabled)',
                )
              : null;
          if (day) {
            event.preventDefault();
            day.focus();
          }
        }}
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? maxDate ?? today}
          startMonth={new Date(1900, 0, 1)}
          endMonth={maxDate ?? new Date(2100, 11, 1)}
          disabled={maxDate ? { after: maxDate } : []}
          onSelect={(date) => {
            if (!date) return;
            onValueChange(calendarValue(date));
            setOpen(false);
          }}
        />
        <div className="flex justify-end border-t border-border px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!value}
            onClick={() => {
              onValueChange('');
              setOpen(false);
            }}
          >
            Clear date
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
