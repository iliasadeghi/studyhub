import { useState } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { useClassStore } from '@/stores/classStore';
import { cn } from '@/utils/cn';
import { Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import type { PriorityLevel, TaskStatus, TaskType } from '@/types';
import { activeFilterCount, DEFAULT_FILTERS, type SortKey, type TaskFilters } from './filters';
import { PRIORITY_META, STATUS_META, STATUS_ORDER, TASK_TYPES } from './taskMeta';

interface Props {
  filters: TaskFilters;
  onChange: (f: TaskFilters) => void;
  hideStatus?: boolean;
}

export function TaskToolbar({ filters, onChange, hideStatus }: Props) {
  const classes = useClassStore((s) => s.classes);
  const [showFilters, setShowFilters] = useState(false);
  const count = activeFilterCount(filters);
  const set = <K extends keyof TaskFilters>(k: K, v: TaskFilters[K]) =>
    onChange({ ...filters, [k]: v });

  const selectCls = 'h-9 text-[13px]';

  return (
    <div className="mb-5 space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            type="search"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            className="pl-9"
          />
        </div>
        <Button
          variant="secondary"
          className="lg:hidden"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="task-filters"
          leftIcon={<Filter className="h-4 w-4" />}
        >
          Filters{count > 0 && ` (${count})`}
        </Button>
      </div>

      <div
        id="task-filters"
        className={cn(
          'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-center',
          !showFilters && 'hidden lg:flex',
        )}
      >
        <Select
          aria-label="Filter by class"
          className={selectCls}
          value={filters.classId}
          onChange={(e) => set('classId', e.target.value)}
        >
          <option value="all">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="none">Personal</option>
        </Select>
        <Select
          aria-label="Filter by type"
          className={selectCls}
          value={filters.type}
          onChange={(e) => set('type', e.target.value as TaskType | 'all')}
        >
          <option value="all">All types</option>
          {TASK_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </Select>
        {!hideStatus && (
          <Select
            aria-label="Filter by status"
            className={selectCls}
            value={filters.status}
            onChange={(e) => set('status', e.target.value as TaskStatus | 'all')}
          >
            <option value="all">Any status</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </Select>
        )}
        <Select
          aria-label="Filter by priority"
          className={selectCls}
          value={filters.priority}
          onChange={(e) => set('priority', e.target.value as PriorityLevel | 'all')}
        >
          <option value="all">Any priority</option>
          {(Object.keys(PRIORITY_META) as PriorityLevel[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_META[p].label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Sort tasks"
          className={selectCls}
          value={filters.sort}
          onChange={(e) => set('sort', e.target.value as SortKey)}
        >
          <option value="priority">Sort: Priority</option>
          <option value="due">Sort: Due date</option>
          <option value="title">Sort: A–Z</option>
          <option value="created">Sort: Newest</option>
        </Select>
        {count > 0 && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<X className="h-4 w-4" />}
            onClick={() => onChange({ ...DEFAULT_FILTERS, sort: filters.sort })}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
