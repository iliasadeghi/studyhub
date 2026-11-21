import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, RotateCcw, Sparkles, Upload } from 'lucide-react';
import { downloadExport, importData, resetToSampleData } from '@/services/storage';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/Button';
import { SettingsSection } from './SettingsSection';

export function DataSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const pushToast = useUIStore((s) => s.pushToast);
  const navigate = useNavigate();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      importData(await file.text());
      pushToast({ variant: 'success', title: 'Backup restored', description: file.name });
    } catch (err) {
      pushToast({
        variant: 'error',
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <SettingsSection
      id="data"
      title="Your data"
      description="Everything is stored in this browser only. Export a backup to move it to another device."
    >
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={() => {
            downloadExport();
            pushToast({ variant: 'success', title: 'Backup downloaded' });
          }}
        >
          Export JSON
        </Button>
        <Button
          variant="secondary"
          leftIcon={<Upload className="h-4 w-4" />}
          onClick={() => fileRef.current?.click()}
        >
          Import JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>
      <div className="rounded-md border border-danger/30 bg-danger-soft/50 p-4">
        <p className="text-sm font-semibold">Danger zone</p>
        <p className="mt-0.5 mb-3 text-xs text-muted">
          Resetting replaces your classes, tasks, notes and messages. Your profile and preferences
          are kept.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="danger"
            size="sm"
            leftIcon={<RotateCcw className="h-4 w-4" />}
            onClick={() => {
              if (
                !window.confirm(
                  'Replace all your data with fresh sample data? This cannot be undone (export a backup first if needed).',
                )
              )
                return;
              resetToSampleData();
              pushToast({ variant: 'success', title: 'Sample data restored' });
            }}
          >
            Reset to sample data
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Sparkles className="h-4 w-4" />}
            onClick={() => {
              useSettingsStore.getState().update({ onboarded: false });
              navigate('/welcome');
            }}
          >
            Replay onboarding
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
