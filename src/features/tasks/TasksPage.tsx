import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckSquare, Columns3, Grid2x2, List, Plus, SearchX } from 'lucide-react';
import type { TaskView } from '@/types';
import { useTaskStore } from '@/stores/taskStore';
import { useClassMap } from '@/stores/classStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { useNow } from '@/hooks/useNow';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState, PageHeader } from '@/components/ui/Misc';
import { pluralize } from '@/utils/format';
import { isOverdue } from '@/utils/dates';
import { applyFilters, DEFAULT_FILTERS, type TaskFilters } from './filters';
import { TaskToolbar } from './TaskToolbar';
import { ListView } from './ListView';
import { BoardView } from './BoardView';
import { MatrixView } from './MatrixView';

const VIEWS: { id: TaskView; label: string; icon: ReactNode }[] = [
  { id: 'list', label: 'List', icon: <List className="h-4 w-4" aria-hidden /> },
  { id: 'board', label: 'Board', icon: <Columns3 className="h-4 w-4" aria-hidden /> },
  { id: 'matrix', label: 'Matrix', icon: <Grid2x2 className="h-4 w-4" aria-hidden /> },
];

export default function TasksPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const classMap = useClassMap();
  const defaultView = useSettingsStore((s) => s.defaultTaskView);
  const weekStartsOn = useSettingsStore((s) => s.weekStartsOn);
  const openTaskForm = useUIStore((s) => s.openTaskForm);
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const view = (
    VIEWS.some((v) => v.id === params.get('view')) ? params.get('view') : defaultView
  ) as TaskView;
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const search = useDebounce(filters.search, 150);

  const visible = useMemo(
    () => applyFilters(tasks, { ...filters, search }, now),
    [tasks, filters, search, now],
  );
  const openCount = tasks.filter((t) => t.status !== 'done').length;
  const overdueCount = tasks.filter((t) => isOverdue(t, now)).length;

  const setView = (v: TaskView) => {
    const next = new URLSearchParams(params);
    next.set('view', v);
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        description={
          <>
            {pluralize(openCount, 'open task')}
            {overdueCount > 0 && (
              <span className="font-semibold text-danger-text"> · {overdueCount} overdue</span>
            )}
          </>
        }
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openTaskForm()}>
            New task
          </Button>
        }
      />

      <div className="mb-4">
        <Tabs
          items={VIEWS}
          value={view}
          onChange={setView}
          label="Task view"
          layoutId="task-view"
          idPrefix="tasks"
        />
      </div>

      {tasks.length > 0 && (
        <TaskToolbar filters={filters} onChange={setFilters} hideStatus={view === 'board'} />
      )}

      <div role="tabpanel" id={`tasks-panel-${view}`} aria-labelledby={`tasks-tab-${view}`}>
        {tasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="h-8 w-8" />}
            title="Your task list is empty"
            description="Add your first assignment, test, or project and StudyHub will help you figure out what to do first."
            action={
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openTaskForm()}>
                Add your first task
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<SearchX className="h-8 w-8" />}
            title="No tasks match"
            description="Try a different search or clear your filters."
            action={
              <Button
                variant="secondary"
                onClick={() => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort })}
              >
                Clear filters
              </Button>
            }
          />
        ) : view === 'list' ? (
          <ListView tasks={visible} classMap={classMap} now={now} weekStartsOn={weekStartsOn} />
        ) : view === 'board' ? (
          <BoardView tasks={visible} classMap={classMap} now={now} />
        ) : (
          <MatrixView tasks={visible} classMap={classMap} now={now} />
        )}
      </div>
    </>
  );
}
