import React, { useEffect, useMemo, useRef, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { invoke } from '@tauri-apps/api/core';

// Ensure we only run one updater flow even if the component is mounted multiple times
let updaterFlowStarted = false;
let updaterPromptDismissed = false; // avoids re-prompting until next app launch

type Phase =
  | 'idle'
  | 'checking'
  | 'prompt'
  | 'downloading'
  | 'installing'
  | 'ready_to_restart'
  | 'up_to_date'
  | 'error';

export default function UpdaterOverlay() {
  const [phase, setPhase] = useState<Phase>('checking');
  const [visible, setVisible] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Checking for updates...');
  const contentLengthRef = useRef<number>(0);
  const downloadedRef = useRef<number>(0);
  const updateRef = useRef<any>(null);

  const percentText = useMemo(() => `${Math.round(progress)}%`, [progress]);

  useEffect(() => {
    let disposed = false;

    async function run() {
      if (updaterFlowStarted || updaterPromptDismissed) {
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
        updateRef.current = update;
        setVersion(update.version);
        setNotes(update.body ?? null);
        setPhase('prompt');
        setVisible(true);
        setStatus('A new version is available.');
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

  async function onUpdateNow() {
    const update = updateRef.current;
    if (!update) return;
    setStatus('Preparing download...');
    downloadedRef.current = 0;
    contentLengthRef.current = 0;
    setProgress(0);
    setPhase('downloading');

    try {
      await update.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started': {
            const total = event.data?.contentLength || 0;
            contentLengthRef.current = total;
            setStatus('Downloading update...');
            break;
          }
          case 'Progress': {
            const chunk = event.data?.chunkLength || 0;
            downloadedRef.current += chunk;
            const total = contentLengthRef.current || event.data?.contentLength || 0;
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

      setPhase('ready_to_restart');
      setStatus('Update installed. Restart to apply.');
    } catch (err) {
      console.error('Download/Install failed:', err);
      setPhase('error');
      setStatus('Update failed. Please try again.');
    }
  }

  function onLater() {
    updaterPromptDismissed = true;
    setVisible(false);
    setPhase('idle');
  }

  async function onRestartNow() {
    try {
      await relaunch();
    } catch (e) {
      console.error('Relaunch failed:', e);
      // Fallback to a backend command that calls app.restart()
      try {
        await invoke('restart_app');
      } catch (err) {
        console.error('Fallback restart failed:', err);
        setStatus('Restart failed. Please close and reopen the app manually.');
        setPhase('error');
      }
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="w-80 rounded-lg border border-gray-200 bg-white/95 shadow-xl backdrop-blur p-4 text-gray-900">
        {/* Header */}
        <div className="mb-2">
          <div className="text-sm font-semibold">
            {phase === 'prompt' && 'Update available'}
            {phase === 'downloading' && 'Downloading update'}
            {phase === 'installing' && 'Installing update'}
            {phase === 'ready_to_restart' && 'Update ready'}
            {phase === 'error' && 'Update failed'}
          </div>
          {version && (
            <div className="text-xs text-gray-600">Version {version}</div>
          )}
        </div>

        {/* Prompt phase */}
        {phase === 'prompt' && (
          <div>
            {notes && (
              <div className="mt-2 max-h-32 overflow-auto text-xs text-gray-600 whitespace-pre-wrap">
                {notes}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={onUpdateNow}
              >
                Update now
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-800 hover:bg-gray-50"
                onClick={onLater}
              >
                Later
              </button>
            </div>
          </div>
        )}

        {/* Progress phases */}
        {(phase === 'downloading' || phase === 'installing') && (
          <>
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
          </>
        )}

        {/* Ready to restart */}
        {phase === 'ready_to_restart' && (
          <div>
            <div className="text-xs text-gray-700">{status}</div>
            <div className="mt-3">
              <button
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 w-full"
                onClick={onRestartNow}
              >
                Restart now
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div>
            <div className="text-xs text-red-600 mb-3">{status}</div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setPhase('prompt')}
              >
                Retry
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-800 hover:bg-gray-50"
                onClick={onLater}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}