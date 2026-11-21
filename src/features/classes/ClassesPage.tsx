import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Plus } from 'lucide-react';
import { useClassStore } from '@/stores/classStore';
import { useTaskStore } from '@/stores/taskStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { useNow } from '@/hooks/useNow';
import { Button } from '@/components/ui/Button';
import { EmptyState, PageHeader } from '@/components/ui/Misc';
import { pluralize } from '@/utils/format';
import { ClassCard } from './ClassCard';
import { ClassFormModal } from './ClassFormModal';
import { JoinClassModal } from './JoinClassForm';
import { useProfile } from '@/stores/authStore';

export default function ClassesPage() {
  const classes = useClassStore((s) => s.classes);
  const tasks = useTaskStore((s) => s.tasks);
  const teachers = useTeacherStore((s) => s.teachers);
  const rosters = useClassStore((s) => s.rosters);
  const teacherView = useProfile().role === 'teacher';
  const now = useNow();
  const [formOpen, setFormOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const primary = teacherView ? 'Create class' : 'Join a class';
  const openPrimary = () => (teacherView ? setFormOpen(true) : setJoinOpen(true));

  return (
    <>
      <PageHeader
        title="Classes"
        description={
          classes.length
            ? pluralize(classes.length, 'class', 'classes') +
              (teacherView ? ' you teach' : ' this semester')
            : undefined
        }
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openPrimary}>
            {primary}
          </Button>
        }
      />
      {classes.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-8 w-8" />}
          title={teacherView ? 'Create your first class' : 'Join your first class'}
          description={
            teacherView
              ? 'You’ll get a join code to share. Students who join can see your class notes and message you.'
              : 'Ask your teacher for their class code. You’ll see their notes and can message them.'
          }
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openPrimary}>
              {primary}
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c, i) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <ClassCard
                cls={c}
                teacher={teachers.find((t) => t.id === c.teacherId)}
                personLine={
                  teacherView
                    ? `${pluralize(rosters[c.id]?.length ?? 0, 'student')} · code ${c.joinCode}`
                    : undefined
                }
                tasks={tasks.filter((t) => t.classId === c.id)}
                now={now}
              />
            </motion.li>
          ))}
        </ul>
      )}
      <ClassFormModal open={formOpen} onClose={() => setFormOpen(false)} classItem={null} />
      <JoinClassModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  );
}
