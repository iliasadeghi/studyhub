import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpenText,
  CheckSquare,
  LayoutGrid,
  Pencil,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useClassStore } from '@/stores/classStore';
import { useTaskStore } from '@/stores/taskStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { useNoteStore } from '@/stores/noteStore';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useNow } from '@/hooks/useNow';
import { subjectVars } from '@/utils/colors';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/Misc';
import { ListView } from '@/features/tasks/ListView';
import { sortTasks } from '@/features/tasks/filters';
import { TeacherProfileCard } from '@/features/teachers/TeacherProfileCard';
import { BookingModal } from '@/features/teachers/BookingModal';
import NotFoundPage from '@/features/NotFoundPage';
import { ClassFormModal } from './ClassFormModal';
import { ClassOverview } from './ClassOverview';
import { ClassNotesList } from './ClassNotesList';
import { scheduleLabel } from '@/utils/classes';
import { SubjectArt } from './art/SubjectArt';
import { artBackground } from './art/pickArt';

type Tab = 'overview' | 'tasks' | 'notes' | 'teacher';

export default function ClassDetailPage() {
  const { classId = '' } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const cls = useClassStore((s) => s.classes.find((c) => c.id === classId));
  const allTasks = useTaskStore((s) => s.tasks);
  const teachers = useTeacherStore((s) => s.teachers);
  const allNotes = useNoteStore((s) => s.notes);
  const openTaskForm = useUIStore((s) => s.openTaskForm);
  const pushToast = useUIStore((s) => s.pushToast);
  const weekStartsOn = useSettingsStore((s) => s.weekStartsOn);
  const now = useNow();
  const [editOpen, setEditOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  if (!cls) return <NotFoundPage />;

  const tab = (params.get('tab') as Tab) || 'overview';
  const setTab = (t: Tab) => setParams(t === 'overview' ? {} : { tab: t }, { replace: true });
  const tasks = sortTasks(
    allTasks.filter((t) => t.classId === cls.id),
    'priority',
    now,
  );
  const notes = allNotes.filter((n) => n.classId === cls.id);
  const teacher = teachers.find((t) => t.id === cls.teacherId);
  const v = subjectVars(cls.color);

  const remove = () => {
    if (!window.confirm(`Delete "${cls.name}"? Its tasks will be kept as personal tasks.`)) return;
    useTaskStore.getState().detachClass(cls.id);
    useClassStore.getState().deleteClass(cls.id);
    pushToast({ title: 'Class deleted', description: cls.name });
    navigate('/classes');
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          to="/classes"
          className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-muted hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> All classes
        </Link>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={remove}
            aria-label={`Delete ${cls.name}`}
          >
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>
      <header
        className="relative mb-6 flex min-h-32 items-end overflow-hidden rounded-xl border border-border p-5 sm:min-h-40 sm:p-6"
        style={artBackground(cls.color)}
      >
        <SubjectArt
          cls={cls}
          className="absolute top-0 right-0 hidden h-full w-[50%] max-w-md py-3 pr-4 sm:block"
        />
        <div className="relative min-w-0 sm:max-w-[55%]">
          <p className="text-sm font-bold" style={{ color: v.text }}>
            {cls.subject}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{cls.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {teacher?.name ?? 'No teacher'} · {cls.room || 'No room'} · {scheduleLabel(cls)}
          </p>
        </div>
      </header>

      <div className="mb-5">
        <Tabs<Tab>
          label="Class sections"
          layoutId="class-tabs"
          idPrefix="class"
          value={tab}
          onChange={setTab}
          items={[
            {
              id: 'overview',
              label: 'Overview',
              icon: <LayoutGrid className="h-4 w-4" aria-hidden />,
            },
            {
              id: 'tasks',
              label: `Tasks (${tasks.filter((t) => t.status !== 'done').length})`,
              icon: <CheckSquare className="h-4 w-4" aria-hidden />,
            },
            {
              id: 'notes',
              label: `Notes (${notes.length})`,
              icon: <BookOpenText className="h-4 w-4" aria-hidden />,
            },
            {
              id: 'teacher',
              label: 'Teacher',
              icon: <UserRound className="h-4 w-4" aria-hidden />,
            },
          ]}
        />
      </div>

      <div role="tabpanel" id={`class-panel-${tab}`} aria-labelledby={`class-tab-${tab}`}>
        {tab === 'overview' && (
          <ClassOverview cls={cls} tasks={tasks} notes={notes} now={now} onTab={setTab} />
        )}
        {tab === 'tasks' && (
          <>
            <div className="mb-4 flex justify-end">
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => openTaskForm(null, { classId: cls.id })}
              >
                Add task
              </Button>
            </div>
            {tasks.length === 0 ? (
              <EmptyState
                icon={<CheckSquare className="h-8 w-8" />}
                title="No tasks for this class"
                description="Add homework, tests, or projects for this class."
              />
            ) : (
              <ListView
                tasks={tasks}
                classMap={{ [cls.id]: cls }}
                now={now}
                weekStartsOn={weekStartsOn}
              />
            )}
          </>
        )}
        {tab === 'notes' && <ClassNotesList classId={cls.id} notes={notes} />}
        {tab === 'teacher' &&
          (teacher ? (
            <TeacherProfileCard
              teacher={teacher}
              classes={[cls]}
              onBook={() => setBookOpen(true)}
            />
          ) : (
            <EmptyState
              icon={<UserRound className="h-8 w-8" />}
              title="No teacher assigned"
              description="Edit this class to add a teacher."
              action={<Button onClick={() => setEditOpen(true)}>Edit class</Button>}
            />
          ))}
      </div>

      <ClassFormModal open={editOpen} onClose={() => setEditOpen(false)} classItem={cls} />
      {teacher && (
        <BookingModal
          open={bookOpen}
          onClose={() => setBookOpen(false)}
          teacher={teacher}
          classItem={cls}
        />
      )}
    </>
  );
}
