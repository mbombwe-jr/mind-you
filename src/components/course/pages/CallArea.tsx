import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, Monitor, CameraOff, PhoneOff } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function useUserMedia(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    let stream: MediaStream | undefined;
    if (enabled && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
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

function useSelfVideoMedia(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    let stream: MediaStream | undefined;
    if (videoRef.current) {
      if (enabled) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(s => {
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = s;
            }
          })
          .catch(() => {});
      } else {
        if (videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach((t: MediaStreamTrack) => { t.enabled = false; });
        }
      }
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [enabled]);
  return videoRef;
}

interface User {
  id: number;
  name: string;
  mic: boolean;
  video: boolean;
  screen: boolean;
}

interface UserVideoBoxProps {
  user: User;
  isSelf: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
  selected: boolean;
  onSelect: () => void;
  onToggle: (userId: number, type: 'mic' | 'video' | 'screen') => void;
  fullScreen?: boolean;
  thumb?: boolean;
  showControls?: boolean;
}

const UserVideoBox: React.FC<UserVideoBoxProps> = ({ 
  user, 
  isSelf, 
  videoRef, 
  selected, 
  onSelect, 
  onToggle, 
  fullScreen, 
  thumb 
}) => (
  <div
    className={`relative bg-zinc-900 rounded-lg flex flex-col items-center overflow-hidden transition-all duration-150 shadow-md border border-zinc-800
      ${selected ? 'ring-2 ring-blue-500' : 'ring-0'} cursor-pointer
      ${fullScreen ? 'w-full h-full min-w-0 min-h-0' : thumb ? 'h-full w-full' : 'w-full h-full'}`}
    onClick={onSelect}
  >
    {/* Big title above avatar/thumbnail if thumb or not fullScreen */}
    {(!fullScreen || thumb) && (
      <div className="w-full text-center pt-3 pb-1">
        <div className="text-lg font-semibold text-white drop-shadow-md">{user.name === 'You' ? 'You' : user.name}</div>
      </div>
    )}
    {isSelf && user.video ? (
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="object-cover w-full h-full absolute top-0 left-0 z-0"
      />
    ) : null}
    {!isSelf || !user.video ? (
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full bg-zinc-800/50">
        <div className="flex flex-col items-center justify-center w-full h-full">
          {user.video ? (
            <Video className="h-8 w-8 text-green-400 opacity-80 mb-2" />
          ) : (
            <CameraOff className="h-8 w-8 text-zinc-500 opacity-80 mb-2" />
          )}
          <Avatar className="h-16 w-16 border-2 border-zinc-700">
            <AvatarFallback className="bg-zinc-700 text-white text-lg font-semibold">
              {user.name[0] || '?'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    ) : null}
    {/* Controls overlay */}
    <div className="absolute left-2 top-2 flex gap-1 z-20">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 bg-zinc-900/80 hover:bg-zinc-800"
        onClick={e => { e.stopPropagation(); onToggle(user.id, 'mic'); }} 
        disabled={!isSelf}
      >
        {user.mic ? <Mic className="text-green-400 h-4 w-4" /> : <MicOff className="text-red-500 h-4 w-4" />}
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 bg-zinc-900/80 hover:bg-zinc-800"
        onClick={e => { e.stopPropagation(); onToggle(user.id, 'video'); }} 
        disabled={!isSelf}
      >
        {user.video ? <Video className="text-green-400 h-4 w-4" /> : <VideoOff className="text-red-500 h-4 w-4" />}
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 bg-zinc-900/80 hover:bg-zinc-800"
        onClick={e => { e.stopPropagation(); onToggle(user.id, 'screen'); }} 
        disabled={!isSelf}
      >
        {user.screen ? <Monitor className="text-blue-400 h-4 w-4" /> : <Monitor className="text-zinc-400 h-4 w-4" />}
      </Button>
    </div>
    {/* Removed name overlay at bottom */}
  </div>
);

interface CallAreaProps {
  users: User[];
  onToggle: (userId: number, type: 'mic' | 'video' | 'screen') => void;
  selfId: number;
  onEndCall?: () => void;
}

const CallArea: React.FC<CallAreaProps> = ({ users, onToggle, selfId, onEndCall }) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const self = users.find(u => u.id === selfId);
  const selfVideoRef = useSelfVideoMedia(self?.video || false);
  const selected = users.find(u => u.id === selectedUserId) || null;

  // The video ref to use in the top display: if showing self, use persistent ref
  let spotlightVideoRef;
  if ((selected && selected.id === selfId) || !selected) {
    spotlightVideoRef = selfVideoRef;
  }

  // Calculate grid layout based on number of users and screen width
  const getGridClass = () => {
    const count = users.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 lg:grid-cols-2';
    // For 3+ users: 2 columns on small/medium, 3 columns on large screens
    return 'grid-cols-2 lg:grid-cols-3';
  };

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950">
      {/* Main video area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden p-3 md:p-5">
        {selected ? (
          // Selected view: Big video on top, thumbnails below
          <div className="flex flex-col h-full gap-3 md:gap-4">
            {/* Main spotlight video */}
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden">
              <UserVideoBox
                user={selected}
                isSelf={selected.id === selfId}
                videoRef={spotlightVideoRef}
                selected={true}
                onSelect={() => setSelectedUserId(null)}
                onToggle={onToggle}
                fullScreen
                showControls={true}
              />
            </div>
            {/* Thumbnail strip */}
            <div className="flex-none h-24 md:h-32 pb-10">
              <div className="flex gap-2 md:gap-3 h-full overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                {users.filter(u => u.id !== selectedUserId).map(user => (
                  <div key={user.id} className="flex-shrink-0 h-full aspect-video">
                    <UserVideoBox
                      user={user}
                      isSelf={user.id === selfId}
                      videoRef={user.id === selfId ? selfVideoRef : undefined}
                      selected={false}
                      onSelect={() => setSelectedUserId(user.id)}
                      onToggle={onToggle}
                      thumb
                      showControls={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Grid view: All users in grid (2 cols on small, 3 cols on large)
          <div className={`grid ${getGridClass()} gap-3 md:gap-5 h-full w-full auto-rows-fr overflow-auto`}>
            {users.map(user => (
              <div key={user.id} className="w-full h-full min-h-0 min-w-0">
                <UserVideoBox
                  user={user}
                  isSelf={user.id === selfId}
                  videoRef={user.id === selfId ? selfVideoRef : undefined}
                  selected={false}
                  onSelect={() => setSelectedUserId(user.id)}
                  onToggle={onToggle}
                  fullScreen
                  showControls={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Controls bar at bottom, always visible, with minHeight */}
      <div className="w-full flex justify-center px-3 py-3 md:py-4 border-t border-zinc-800 bg-zinc-900 z-50" style={{ minHeight: '64px' }}>
        <div className="flex items-center gap-3 md:gap-4">
          {/* Microphone Control */}
          <Button
            variant={self?.mic ? "default" : "destructive"}
            size="lg"
            className={`h-12 w-12 rounded-full ${self?.mic ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-red-600 hover:bg-red-700'}`}
            onClick={() => onToggle(selfId, 'mic')}
          >
            {self?.mic ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          {/* Video Control */}
          <Button
            variant={self?.video ? "default" : "destructive"}
            size="lg"
            className={`h-12 w-12 rounded-full ${self?.video ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-red-600 hover:bg-red-700'}`}
            onClick={() => onToggle(selfId, 'video')}
          >
            {self?.video ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          {/* Screen Share Control */}
          <Button
            variant={self?.screen ? "default" : "secondary"}
            size="lg"
            className={`h-12 w-12 rounded-full ${self?.screen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
            onClick={() => onToggle(selfId, 'screen')}
          >
            <Monitor className="h-5 w-5" />
          </Button>

          {/* End Call Button */}
          <Button
            variant="destructive"
            size="lg"
            className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 ml-2"
            onClick={onEndCall}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CallArea;