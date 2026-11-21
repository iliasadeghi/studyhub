import type { SubjectColor } from '@/types';

export interface DraftClass {
  key: string;
  name: string;
  teacher: string;
  color: SubjectColor;
  room: string;
}

let counter = 0;

export const newDraft = (name = '', color: SubjectColor = 'blue'): DraftClass => ({
  key: `d${counter++}`,
  name,
  teacher: '',
  color,
  room: '',
});
