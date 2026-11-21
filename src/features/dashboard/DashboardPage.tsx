import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useClassMap, useClassStore } from '@/stores/classStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { useNow } from '@/hooks/useNow';
import { greeting, isOverdue } from '@/utils/dates';
import { Button } from '@/components/ui/Button';
import { Kbd } from '@/components/ui/Misc';
import { FocusNowCard } from './FocusNowCard';
import { ProgressCard } from './ProgressCard';
import { WorkloadCard } from './WorkloadCard';
import { TodayCard, UpcomingCard } from './AgendaCards';
import { RecentMessagesCard, RecentNotesCard } from './RecentCards';
import { TeacherDashboard } from './TeacherDashboard';
import { useProfile } from '@/stores/authStore';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function DashboardPage() {
  const role = useProfile().role;
  return role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />;
}

function StudentDashboard() {
  const tasks = useTaskStore((s) => s.tasks);
  const classes = useClassStore((s) => s.classes);
  const classMap = useClassMap();
  const name = useProfile().fullName.split(' ')[0];
  const weekStartsOn = useSettingsStore((s) => s.weekStartsOn);
  const openTaskForm = useUIStore((s) => s.openTaskForm);
  const now = useNow();

  const dueToday = tasks.filter(
    (t) =>
      t.status !== 'done' && format(new Date(t.dueAt), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd'),
  ).length;
  const overdue = tasks.filter((t) => isOverdue(t, now)).length;
  const summary =
    overdue > 0
      ? `You have ${overdue} overdue task${overdue > 1 ? 's' : ''} — let's knock ${overdue > 1 ? 'them' : 'it'} out.`
      : dueToday > 0
        ? `${dueToday} thing${dueToday > 1 ? 's' : ''} due today. You've got this.`
        : 'Nothing due today. Great time to get ahead!';

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.header variants={item} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-accent-text">{format(now, 'EEEE, MMMM d')}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {greeting(now)}
            {name ? `, ${name}` : ''} 👋
          </h1>
          <p className="mt-1 text-muted">{summary}</p>
        </div>
        <div className="hidden sm:block">
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openTaskForm()}>
            Quick add{' '}
            <span className="ml-1 opacity-80">
              <Kbd>N</Kbd>
            </span>
          </Button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2">
          <FocusNowCard tasks={tasks} classMap={classMap} now={now} />
        </motion.div>
        <motion.div variants={item}>
          <ProgressCard tasks={tasks} now={now} weekStartsOn={weekStartsOn} />
        </motion.div>
        <motion.div variants={item}>
          <TodayCard tasks={tasks} classMap={classMap} now={now} />
        </motion.div>
        <motion.div variants={item}>
          <UpcomingCard tasks={tasks} classMap={classMap} now={now} />
        </motion.div>
        <motion.div variants={item}>
          <WorkloadCard tasks={tasks} classes={classes} />
        </motion.div>
        <motion.div variants={item} className="lg:col-span-2">
          <RecentNotesCard classMap={classMap} />
        </motion.div>
        <motion.div variants={item}>
          <RecentMessagesCard />
        </motion.div>
      </div>
    </motion.div>
  );
}
