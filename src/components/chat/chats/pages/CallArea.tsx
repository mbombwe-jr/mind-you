import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, Monitor, CameraOff } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function useUserMedia(enabled) {
  const videoRef = useRef(null);
  useEffect(() => {
    let stream;
    if (enabled && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          videoRef.current.srcObject = s;
        })
        .catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [enabled]);
  return videoRef;
}

const UserVideoBox = ({ user, isSelf, videoRef, selected, onSelect, onToggle }) => (
  <div
    className={`relative bg-zinc-900 rounded-lg flex flex-col items-center aspect-video overflow-hidden transition-all duration-150 shadow-md border \
      ${selected ? 'ring-2 ring-primary' : 'ring-0'} cursor-pointer min-w-[140px] min-h-[110px]`}
    onClick={onSelect}
  >
    {isSelf && user.video ? (
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="object-cover h-full w-full absolute top-0 left-0 z-0"
      />
    ) : null}
    {!isSelf || !user.video ? (
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <div className="flex flex-col items-center justify-center h-full w-full">
          {user.video ? (
            <Video className="h-8 w-8 text-green-400 opacity-80 mb-1" />
          ) : (
            <CameraOff className="h-8 w-8 text-muted opacity-80 mb-1" />
          )}
          <Avatar className="h-14 w-14 mt-1">
            <AvatarFallback>{user.name[0] || '?'}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    ) : null}
    {/* Controls overlay */}
    <div className="absolute left-1 top-1 flex gap-0.5 z-20">
      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); onToggle(user.id, 'mic'); }} disabled={!isSelf}>
        {user.mic ? <Mic className="text-green-400 h-4 w-4" /> : <MicOff className="text-red-500 h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); onToggle(user.id, 'video'); }} disabled={!isSelf}>
        {user.video ? <Video className="text-green-400 h-4 w-4" /> : <VideoOff className="text-red-500 h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); onToggle(user.id, 'screen'); }} disabled={!isSelf}>
        {user.screen ? <Monitor className="text-blue-500 h-4 w-4" /> : <Monitor className="h-4 w-4" />}
      </Button>
    </div>
    <div className="absolute left-2 bottom-2 text-xs text-white/80 z-20">{user.name === 'You' ? 'You' : user.name}</div>
  </div>
);

const CallArea = ({ users, onToggle, selfId, controlsBar }) => {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const self = users.find(u => u.id === selfId);
  const selfVideoRef = useUserMedia(self?.video);
  const selected = users.find(u => u.id === selectedUserId) || null;
  // Responsive: min 2, max 3 per row
  const miniGridCols = users.length > 4 ? 'md:grid-cols-3 sm:grid-cols-2 grid-cols-1' : 'sm:grid-cols-2 grid-cols-1';
  const mainDisplay = selected ? [selected] : users;
  const miniDisplay = selected ? users.filter(u => u.id !== selected.id) : [];

  return (
    <div className="flex flex-col w-full h-screen min-h-0 bg-background rounded-xl border p-3 shadow-sm max-w-none mx-auto">
      {selected ? (
        <div className="w-full flex justify-center pb-2">
          <div className="w-full max-w-2xl">
            <UserVideoBox
              user={selected}
              isSelf={selected.id === selfId}
              videoRef={selected.id === selfId ? selfVideoRef : undefined}
              selected={true}
              onSelect={() => setSelectedUserId(null)}
              onToggle={onToggle}
            />
          </div>
        </div>
      ) : null}
      <div className={`grid gap-2 grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 w-full`}>
        {(selected ? miniDisplay : users).map(user => (
          <UserVideoBox
            key={user.id}
            user={user}
            isSelf={user.id === selfId}
            videoRef={user.id === selfId ? selfVideoRef : undefined}
            selected={selectedUserId === user.id}
            onSelect={() => setSelectedUserId(user.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
      {/* Controls bar slotted below (not inside) */}
      {controlsBar}
    </div>
  );
};

export default CallArea;
