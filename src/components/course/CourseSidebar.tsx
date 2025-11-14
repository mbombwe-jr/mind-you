import { Plus, MessageSquare, Inbox, Reply, FileText, Activity, Send, ChevronDown, ChevronRight, VolumeX, Hash, BookOpen, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCourseContext } from "@/contexts/CourseContext";
import { useState, useMemo, useEffect } from "react";
import SidebarHeader from "@/components/SidebarHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useNetwork } from '@/contexts/NetworkContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CourseSidebarProps {
  onChannelSelect?: () => void;
}

const CourseSidebar = ({ onChannelSelect }: CourseSidebarProps) => {
  const { 
    currentView, 
    setCurrentView, 
    currentCourse, 
    setCurrentCourse, 
    courses, 
    setCurrentTab,
    userCourses,
    allCourses,
    isLoadingCourses,
    fetchUserCourses,
    fetchAllCourses,
    nodeGroups,
  } = useCourseContext();
  
  const { interfaces = [] } = useNetwork();
  const [membersOpen, setMembersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['moodle-courses', 'node-groups', 'direct-messages'])
  );

  // Set default view to enrolledCourses on mount
  useEffect(() => {
    if (currentView !== 'enrolledCourses' && currentView !== 'allCourses' && currentView !== 'contacts' && currentView !== 'courseDetails') {
      setCurrentView('enrolledCourses');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Filter courses based on search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) {
      return courses;
    }
    const query = searchQuery.toLowerCase();
    return courses.filter(course => 
      course.name.toLowerCase().includes(query) ||
      course.fullname?.toLowerCase().includes(query)
    );
  }, [courses, searchQuery]);

  // Separate courses by type
  const moodleCourses = filteredCourses.filter(c => c.type === 'channel' && c.courseId);
  const nodeGroupChannels = filteredCourses.filter(c => c.type === 'channel' && !c.courseId);
  const dmList = filteredCourses.filter(c => c.type === 'dm');

  // Members for selected group
  const groupMembers = (currentCourse && currentCourse.name && !currentCourse.courseId)
    ? interfaces.filter((node) => node.group_name === currentCourse.name)
    : [];

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-hidden flex-shrink-0 max-md:w-full">
      {/* SidebarHeader */}
      <SidebarHeader
        title="Courses"
        Icon={BookOpen}
        className="bg-sidebar border-sidebar-border"
        colorMode="default"
        action={
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-sidebar-hover"
              onClick={fetchUserCourses}
              disabled={isLoadingCourses}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingCourses ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-sidebar-hover">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Search Input */}
      <div className="p-2 border-b border-sidebar-border">
        <Input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 min-h-0 w-full">
        <div className="p-2 w-full">
          {/* Main Navigation */}
          <div className="space-y-0.5 mb-4">
            {[
              { id: 'enrolledCourses', label: 'Enrolled Courses', icon: FileText },
              { id: 'allCourses', label: 'All Courses', icon: BookOpen },
            ].map((item) => {
              // Page navigation is only active when:
              // 1. currentView matches the item id (enrolledCourses or allCourses)
              // 2. No course is currently selected (currentCourse is null)
              // This ensures page tabs are only active when viewing the list, not when viewing a course
              const isActive = currentView === item.id && !currentCourse;
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start h-9 px-2 text-sm hover:bg-chat-hover rounded-md ${
                    isActive ? 'bg-chat-active text-primary font-semibold' : 'font-normal'
                  }`}
                  onClick={() => {
                    setCurrentView(item.id);
                    setCurrentCourse(null); // Clear course selection when switching views
                    if (item.id === 'allCourses') {
                      fetchAllCourses();
                    } else if (item.id === 'enrolledCourses') {
                      fetchUserCourses();
                    }
                  }}
                >
                  <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Members Dialog */}
          <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {currentCourse?.name} Members ({groupMembers.length})
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {groupMembers.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No members in this group.
                    </div>
                  )}
                  {groupMembers.map((iface, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{iface.node_name}</div>
                        <div className="text-xs text-gray-500">
                          {iface.addr}{iface.cidr ? ` / ${iface.cidr}` : ''}
                        </div>
                      </div>
                      <Badge variant={iface.has_udp_socket ? "default" : "secondary"}>
                        {iface.has_udp_socket ? 'online' : 'offline'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Moodle Courses Section */}
          <div className="pb-16">
            <button
              onClick={() => toggleSection('moodle-courses')}
              className="w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center justify-between uppercase tracking-wider hover:bg-sidebar-hover rounded transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-3 w-3" />
                <span>My Courses</span>
                {isLoadingCourses && (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                )}
              </div>
              {expandedSections.has('moodle-courses') ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
            
            {expandedSections.has('moodle-courses') && (
              <div className="space-y-0.5 mt-1">
                {moodleCourses.length > 0 ? (
                  moodleCourses.map((course) => (
                    <Button
                      key={course.id}
                      variant="ghost"
                      className={`w-full justify-start h-auto min-h-[36px] px-2 py-1.5 text-sm hover:bg-chat-hover rounded-md ${
                        currentCourse?.id === course.id 
                          ? 'bg-chat-active text-primary font-semibold' 
                          : 'font-normal text-sidebar-foreground'
                      }`}
                      onClick={() => {
                        setCurrentCourse(course);
                        setCurrentView('courseDetails'); // Show course details, not course list
                        onChannelSelect?.();
                      }}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <Hash className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1 text-left min-w-0">
                          <div className="truncate">{course.shortname || course.name}</div>
                          {course.fullname && course.fullname !== course.name && (
                            <div className="text-xs text-muted-foreground truncate">
                              {course.fullname}
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))
                ) : (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                    {isLoadingCourses ? 'Loading courses...' : 'No courses enrolled'}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </ScrollArea>
    </div>  
  );
};

export default CourseSidebar;