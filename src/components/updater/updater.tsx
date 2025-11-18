import React, { useEffect, useMemo, useRef, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

// Ensure we only run one updater flow even if the component is mounted multiple times
let updaterFlowStarted = false;

type Phase = 'idle' | 'checking' | 'found' | 'downloading' | 'installing' | 'relaunching' | 'up_to_date' | 'error';

export default function UpdaterOverlay() {
  const [phase, setPhase] = useState<Phase>('checking');
  const [visible, setVisible] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Checking for updates...');
  const contentLengthRef = useRef<number>(0);
  const downloadedRef = useRef<number>(0);

  const percentText = useMemo(() => `${Math.round(progress)}%`, [progress]);

  useEffect(() => {
    let disposed = false;

    async function run() {
      if (updaterFlowStarted) {
        // Another instance already started the flow; keep invisible
        setVisible(false);
        return;
      }
      updaterFlowStarted = true;

      try {
        setPhase('checking');
        setStatus('Checking for updates...');
        const update = await check();
        if (!update) {
          setPhase('up_to_date');
          setVisible(false);
          return;
        }

        if (disposed) return;
        setVersion(update.version);
        setNotes(update.body ?? null);
        setPhase('found');
        setVisible(true);
        setStatus('Downloading update...');

        downloadedRef.current = 0;
        contentLengthRef.current = 0;
        setProgress(0);

        // Start download and install
        setPhase('downloading');
        await update.downloadAndInstall((event) => {
          if (disposed) return;
          switch (event.event) {
            case 'Started': {
              const total = event.data.contentLength || 0;
              contentLengthRef.current = total;
              setStatus('Downloading update...');
              break;
            }
            case 'Progress': {
              downloadedRef.current += event.data.chunkLength || 0;
              const total = contentLengthRef.current || event.data.contentLength || 0;
              if (total > 0) {
                const pct = Math.min(100, (downloadedRef.current / total) * 100);
                setProgress(pct);
              }
              break;
            }
            case 'Finished': {
              setProgress(100);
              setPhase('installing');
              setStatus('Installing update...');
              break;
            }
          }
        });

        if (disposed) return;
        setPhase('relaunching');
        setStatus('Restarting to apply update...');
        await relaunch();
      } catch (e: any) {
        console.error('Updater error:', e);
        if (disposed) return;
        setVisible(false);
        setPhase('error');
      }
    }

    run();
    return () => {
      disposed = true;
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="w-80 rounded-lg border border-gray-200 bg-white/95 shadow-xl backdrop-blur p-4 text-gray-900">
        <div className="mb-2">
          <div className="text-sm font-semibold">Updating application</div>
          {version && (
            <div className="text-xs text-gray-600">Version {version}</div>
          )}
        </div>

        <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-700">
          <span>{status}</span>
          <span className="tabular-nums">{percentText}</span>
        </div>

        {notes && phase === 'found' && (
          <div className="mt-2 max-h-24 overflow-auto text-xs text-gray-600">
            {notes}
          </div>
        )}
      </div>
    </div>
  );
}