import React, { useState, useEffect, useCallback } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Search, User, X, UserPlus, Loader2, MessageCircle, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { invoke } from '@tauri-apps/api/core';
import { toast } from "sonner";
import { useChatContext } from "@/contexts/ChatContext";

interface Contact {
  id: number;
  fullname: string;
  profileimageurl?: string;
  profileimageurlsmall?: string;
  email?: string;
}

const Tabs = ({ tab, onChange, contactsCount, requestsCount }: {
  tab: 'contacts' | 'requests';
  onChange: (t: 'contacts' | 'requests') => void;
  contactsCount: number;
  requestsCount: number;
}) => (
  <div className="flex gap-2 mb-5 border-b">
    <button onClick={() => onChange('contacts')} className={`py-2 px-4 font-semibold border-b-2 ${tab === 'contacts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>Contacts ({contactsCount})</button>
    <button onClick={() => onChange('requests')} className={`py-2 px-4 font-semibold border-b-2 ${tab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>Requests ({requestsCount})</button>
  </div>
);

const ContactsPage = () => {
  const { setCurrentChannel, setCurrentView, fetchConversations } = useChatContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [requestingIds, setRequestingIds] = useState<Set<number>>(new Set());
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [openingChatIds, setOpeningChatIds] = useState<Set<number>>(new Set());
  const [tab, setTab] = useState<'contacts' | 'requests'>('contacts');

  // Request logic state (merged from RequestsPage)
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  const fetchUserContacts = useCallback(async () => {
    setIsLoadingContacts(true);
    setError(null);
    
    try {
      const response = await invoke<any>('get_user_contacts');
      
      // Moodle API returns { contacts: [...] } or just an array
      const contactsData = response?.contacts || (Array.isArray(response) ? response : []);
      
      if (Array.isArray(contactsData) && contactsData.length > 0) {
        setContacts(contactsData.map((contact: any): Contact => ({
          id: contact.id || contact.userid,
          fullname: contact.fullname || contact.name || `User ${contact.id || contact.userid}`,
          profileimageurl: contact.profileimageurl,
          profileimageurlsmall: contact.profileimageurlsmall,
          email: contact.email,
        })));
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.error('Failed to fetch user contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
      setContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  const searchContacts = useCallback(async (query: string) => {
    if (!query.trim()) {
      // If search is cleared, reload user contacts
      await fetchUserContacts();
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const response = await invoke<any>('search_contacts', {
        searchText: query,
        onlyMyCourses: null,
      });
      
      // Moodle API returns { contacts: [...] } or just an array
      const contactsData = response?.contacts || (Array.isArray(response) ? response : []);
      
      if (Array.isArray(contactsData) && contactsData.length > 0) {
        setContacts(contactsData.map((contact: any): Contact => ({
          id: contact.id || contact.userid,
          fullname: contact.fullname || contact.name || `User ${contact.id || contact.userid}`,
          profileimageurl: contact.profileimageurl,
          profileimageurlsmall: contact.profileimageurlsmall,
          email: contact.email,
        })));
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.error('Failed to search contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to search contacts');
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserContacts]);

  const handleCreateContactRequest = async (contactId: number) => {
    if (requestingIds.has(contactId)) {
      return; // Already processing
    }

    setRequestingIds(prev => new Set(prev).add(contactId));

    try {
      await invoke('create_contact_request', {
        requestedUserId: contactId,
      });
      
      toast.success('Contact request sent successfully');
    } catch (err) {
      console.error('Failed to create contact request:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to send contact request');
    } finally {
      setRequestingIds(prev => {
        const next = new Set(prev);
        next.delete(contactId);
        return next;
      });
    }
  };

  const handleOpenChat = useCallback(async (contact: Contact) => {
    if (openingChatIds.has(contact.id)) {
      return; // Already processing
    }

    setOpeningChatIds(prev => new Set(prev).add(contact.id));

    try {
      // First, refresh conversations to get the latest list
      await fetchConversations();

      // Check if a conversation already exists with this user
      // We need to get the updated directMessageChannels after fetchConversations
      // Since fetchConversations is async, we'll need to check conversations directly
      const conversationsResponse = await invoke<any>('get_conversations');
      const conversations = conversationsResponse?.conversations || (Array.isArray(conversationsResponse) ? conversationsResponse : []);

      // Find conversation with this user
      const existingConversation = conversations.find((conv: any) => {
        const members = conv.members || [];
        return members.some((m: any) => 
          (m.id === contact.id || m.userid === contact.id) && !m.iscurrentuser
        );
      });

      if (existingConversation) {
        // Conversation exists, open it
        const otherMember = existingConversation.members.find((m: any) => 
          (m.id === contact.id || m.userid === contact.id) && !m.iscurrentuser
        ) || existingConversation.members[0];

        const channel = {
          id: `dm_${existingConversation.id}`,
          name: contact.fullname,
          type: 'dm' as const,
          conversationId: existingConversation.id,
          profileImageUrl: contact.profileimageurlsmall || contact.profileimageurl,
        };

        setCurrentChannel(channel);
        setCurrentView('chat');
        toast.success(`Opened chat with ${contact.fullname}`);
      } else {
        // No conversation exists, create a temporary channel
        // Moodle will create the conversation when the first message is sent
        const tempChannel = {
          id: `dm_temp_${contact.id}`,
          name: contact.fullname,
          type: 'dm' as const,
          conversationId: undefined, // Will be set when conversation is created
          profileImageUrl: contact.profileimageurlsmall || contact.profileimageurl,
          userId: contact.id, // Store user ID to create conversation later
        };

        setCurrentChannel(tempChannel);
        setCurrentView('chat');
        toast.success(`Starting chat with ${contact.fullname}`);
      }
    } catch (err) {
      console.error('Failed to open chat:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to open chat');
    } finally {
      setOpeningChatIds(prev => {
        const next = new Set(prev);
        next.delete(contact.id);
        return next;
      });
    }
  }, [openingChatIds, fetchConversations, setCurrentChannel, setCurrentView]);

  const fetchContactRequests = async () => {
    setIsLoadingRequests(true);
    setRequestsError(null);
    try {
      const response = await invoke<any>('get_contact_requests');
      const requestsData = response?.requests || (Array.isArray(response) ? response : []);
      if (Array.isArray(requestsData) && requestsData.length > 0) {
        setRequests(requestsData.map((req: any) => ({
          id: req.id,
          userid: req.id,
          fullname: req.fullname || req.name || `User ${req.id}`,
          profileimageurl: req.profileimageurl,
          profileimageurlsmall: req.profileimageurlsmall,
        })));
      } else {
        setRequests([]);
      }
    } catch (err) {
      setRequestsError(err instanceof Error ? err.message : 'Failed to fetch contact requests');
      setRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (tab === 'requests') {
      fetchContactRequests();
    }
  }, [tab]);

  const handleAccept = async (requestedUserId: number) => {
    try {
      await invoke('confirm_contact_request', {
        requestedUserId: Number(requestedUserId),
      });
      setRequests(prev => prev.filter(req => req.userid !== requestedUserId));
      toast.success('Contact request accepted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept request');
    }
  };
  const handleDecline = async (requestedUserId: number) => {
    try {
      await invoke('decline_contact_request', {
        requestedUserId: Number(requestedUserId),
      });
      setRequests(prev => prev.filter(req => req.userid !== requestedUserId));
      toast.success('Contact request declined');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to decline request');
    }
  };

  // Load user contacts on mount
  useEffect(() => {
    fetchUserContacts();
  }, [fetchUserContacts]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchContacts(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchContacts]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Contacts</h2>
            <p className="text-sm text-muted-foreground">Search and manage your contacts and requests</p>
          </div>
        </div>
        <Tabs tab={tab} onChange={setTab} contactsCount={contacts.length} requestsCount={requests.length} />
        {tab === 'contacts' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 text-sm bg-background pl-10 pr-10 w-full border-border"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-muted"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      <ScrollArea className="flex-1 w-full [&>[data-radix-scroll-area-viewport]]:scroll-smooth">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 pt-4">
        {tab === 'contacts' ? (
          <>
            {!hasSearched && !searchQuery && (
              <>
                {isLoadingContacts ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Loader2 className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
                    <p className="text-lg font-medium mb-2">Loading contacts...</p>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No contacts yet</p>
                    <p className="text-sm">Search for contacts to add them.</p>
                  </div>
                ) : null}
              </>
            )}

            {isLoading && hasSearched && (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                <p className="text-lg font-medium mb-2">Searching...</p>
              </div>
            )}

            {error && (
              <div className="p-6 text-center text-destructive">
                <p className="text-lg font-medium mb-2">Error searching contacts</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {hasSearched && !isLoading && !error && contacts.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No contacts found</p>
                <p className="text-sm">Try a different search term.</p>
              </div>
            )}

            {contacts.length > 0 && (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-4 p-4 bg-background border border-border rounded-lg hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => !hasSearched && handleOpenChat(contact)}
                  >
                    <Avatar className="h-10 w-10">
                      {contact.profileimageurlsmall || contact.profileimageurl ? (
                        <AvatarImage 
                          src={contact.profileimageurlsmall || contact.profileimageurl} 
                          alt={contact.fullname}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/20 text-primary font-medium">
                        {contact.fullname.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleOpenChat(contact)}
                    >
                      <p className="font-semibold text-foreground truncate">{contact.fullname}</p>
                      {contact.email && (
                        <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!hasSearched && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChat(contact);
                          }}
                          disabled={openingChatIds.has(contact.id)}
                          className="shrink-0"
                        >
                          {openingChatIds.has(contact.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageCircle className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {hasSearched && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateContactRequest(contact.id);
                          }}
                          disabled={requestingIds.has(contact.id)}
                          className="shrink-0"
                        >
                          {requestingIds.has(contact.id) ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Contact
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // Request list (moved from RequestsPage)
          <>
            {isLoadingRequests ? (
              <div className="p-6 text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                <p className="text-lg font-medium mb-2">Loading requests...</p>
              </div>
            ) : requestsError ? (
              <div className="p-6 text-center text-destructive">
                <p className="text-lg font-medium mb-2">Error loading requests</p>
                <p className="text-sm">{requestsError}</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No contact requests</p>
                <p className="text-sm">You're all caught up! No pending requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center gap-4 p-4 bg-background border border-border rounded-lg hover:bg-accent/30 transition-colors">
                    <Avatar className="h-12 w-12">
                      {request.profileimageurlsmall || request.profileimageurl ? (
                        <AvatarImage
                          src={request.profileimageurlsmall || request.profileimageurl}
                          alt={request.fullname}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/20 text-primary font-medium">
                        {request.fullname.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{request.fullname}</p>
                      <p className="text-sm text-muted-foreground">Wants to connect with you</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="default" size="sm" className="h-9 px-4" onClick={() => handleAccept(request.userid)}>
                        <UserPlus className="h-4 w-4 mr-1.5" />Accept
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 px-4" onClick={() => handleDecline(request.userid)}>
                        <UserX className="h-4 w-4 mr-1.5" />Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ContactsPage;

