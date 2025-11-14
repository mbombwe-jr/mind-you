// Mock API for conversations data
export interface ConversationMock {
  id: string;
  name: string;
  avatar: string;
  status: string;
  is_online: boolean;
  pin?: boolean;
  archived?: boolean;
}

// Mock conversations data
const mockConversations: ConversationMock[] = [
  {
    id: '1',
    name: 'John Doe',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    status: 'online',
    is_online: true,
    pin: true,
    archived: false
  },
  {
    id: '2',
    name: 'Mike Johnson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
    status: 'offline',
    is_online: false,
    pin: false,
    archived: false
  },
  {
    id: '3',
    name: 'Sarah Wilson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
    status: 'dnd',
    is_online: true,
    pin: true,
    archived: false
  }
];

// Mock API function
export async function getConversationsMock(): Promise<ConversationMock[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockConversations;
}

// Mock card info interface
export interface CardInfoMock {
  name: string;
  reg_no: string;
  programme: string;
}

// Mock card info data
const mockCardInfo: CardInfoMock = {
  name: 'John Doe',
  reg_no: '2023/12345',
  programme: 'Computer Science'
};

// Mock API function for card info
export async function getCardInfoMock(): Promise<CardInfoMock> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockCardInfo;
}


