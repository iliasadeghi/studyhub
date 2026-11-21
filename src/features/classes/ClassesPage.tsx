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

export default function ClassesPage() {
  const classes = useClassStore((s) => s.classes);
  const tasks = useTaskStore((s) => s.tasks);
  const teachers = useTeacherStore((s) => s.teachers);
  const now = useNow();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Classes"
        description={pluralize(classes.length, 'class', 'classes') + ' this semester'}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
            Add class
          </Button>
        }
      />
      {classes.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-8 w-8" />}
          title="Add your first class"
          description="Classes keep your tasks, notes, and teachers organized and color-coded."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              Add class
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
                tasks={tasks.filter((t) => t.classId === c.id)}
                now={now}
              />
            </motion.li>
          ))}
        </ul>
      )}
      <ClassFormModal open={formOpen} onClose={() => setFormOpen(false)} classItem={null} />
    </>
  );
}
