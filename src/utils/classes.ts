import type { ClassItem } from '@/types';
import { formatTime12, WEEKDAY_SHORT } from './dates';

export function scheduleLabel(c: ClassItem): string {
  if (c.schedule.days.length === 0) return 'No schedule';
  return `${c.schedule.days.map((d) => WEEKDAY_SHORT[d]).join(' · ')}, ${formatTime12(c.schedule.start)}`;
}
