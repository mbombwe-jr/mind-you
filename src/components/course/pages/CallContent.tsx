import { useState } from 'react';
import CallArea from './CallArea';
import { Button } from '@/components/ui/button';
import { Video, Mic, MicOff, VideoOff, Monitor, MonitorOff, PhoneOff } from 'lucide-react';

// Dummy user data for channel: more users
const dummyUsers = [
  { id: 1, name: 'You', mic: true, video: true, screen: false },
  { id: 2, name: 'Alex', mic: false, video: true, screen: false },
  { id: 3, name: 'Morgan', mic: true, video: false, screen: false },
  { id: 4, name: 'Jordan', mic: true, video: true, screen: false },
  { id: 5, name: 'Taylor', mic: true, video: true, screen: false },
];

const CallContent = () => {
  const [users, setUsers] = useState(dummyUsers);
  const [selfId] = useState(1);

  function toggleUser(id, key) {
    setUsers(users => users.map(u => u.id === id ? { ...u, [key]: !u[key] } : u));
  }
  function leaveCall() {
    window.alert('Leaving call (mock)');
  }

  // Controls bar for below call grid
  const controlsBar = (
    <div className="flex justify-center items-center gap-4 py-3 border-t border-border mt-3 bg-background sticky bottom-0 z-40">
      <Button variant="ghost" size="icon" onClick={() => toggleUser(selfId, 'mic')}>
        {users.find(u => u.id === selfId)?.mic ? <Mic /> : <MicOff className="text-red-500" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={() => toggleUser(selfId, 'video')}>
        {users.find(u => u.id === selfId)?.video ? <Video /> : <VideoOff className="text-red-500" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={() => toggleUser(selfId, 'screen')}>
        {users.find(u => u.id === selfId)?.screen ? <Monitor /> : <MonitorOff />}
      </Button>
      <Button variant="destructive" size="icon" onClick={leaveCall}>
        <PhoneOff />
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <CallArea
        users={users}
        onToggle={(id, key) => toggleUser(id, key)}
        selfId={selfId}
        controlsBar={controlsBar}
      />
    </div>
  );
};

export default CallContent;
