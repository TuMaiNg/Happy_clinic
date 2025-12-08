import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, isBefore, isAfter } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  highlightedDates?: Date[];
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  highlightedDates = [],
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fill the calendar grid (start from Monday)
  const startDayOfWeek = monthStart.getDay();
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, minDate)) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return false;
  };

  const isDateHighlighted = (date: Date) => {
    return highlightedDates.some(d => isSameDay(d, date));
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-neutral-light rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-neutral-dark" />
        </button>
        <h3 className="text-lg font-semibold text-neutral-dark">
          {format(currentMonth, 'MMMM yyyy', { locale: vi })}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-neutral-light rounded-lg transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5 text-neutral-dark" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-neutral-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding for first week */}
        {Array.from({ length: paddingDays }).map((_, index) => (
          <div key={`padding-${index}`} />
        ))}

        {/* Days */}
        {days.map((day) => {
          const disabled = isDateDisabled(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);
          const highlighted = isDateHighlighted(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => !disabled && onDateSelect(day)}
              disabled={disabled}
              className={`
                aspect-square p-2 text-sm rounded-lg transition-all relative
                ${disabled 
                  ? 'text-neutral-medium bg-neutral-light cursor-not-allowed opacity-50' 
                  : 'hover:bg-primary-50 cursor-pointer'
                }
                ${selected 
                  ? 'bg-primary-500 text-white font-semibold hover:bg-primary-600' 
                  : ''
                }
                ${today && !selected 
                  ? 'ring-2 ring-primary-500 font-semibold' 
                  : ''
                }
              `}
            >
              {format(day, 'd')}
              {highlighted && !selected && (
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-secondary-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-neutral-medium">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary-500" />
          <span>Đã chọn</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded ring-2 ring-primary-500" />
          <span>Hôm nay</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded relative">
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-secondary-500 rounded-full" />
          </div>
          <span>Có lịch trống</span>
        </div>
      </div>
    </div>
  );
};

