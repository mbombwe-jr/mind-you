import React, { useState } from 'react';
import { CourseProvider, useCourseContext } from '@/contexts/CourseContext';
import ChatArea from '@/components/course/pages/ChannelArea';
import ChannelArea from '@/components/course/pages/ChannelArea';
import CourseSidebar from '@/components/course/CourseSidebar';
import CourseDetailsView from '@/components/course/CourseDetailsView';
import CourseList from '@/components/course/CourseList';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Menu, BookOpen, MessageSquare, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function CourseContent() {
  const { currentCourse, currentView, setCurrentView } = useCourseContext();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Determine if we're viewing a Moodle course, network group, or DM
  const isMoodleCourse = currentCourse?.type === 'channel' && currentCourse?.courseId;
  const isNetworkGroup = currentCourse?.type === 'channel' && !currentCourse?.courseId;
  const isDirectMessage = currentCourse?.type === 'dm';
  
  // Render the appropriate page based on currentView
  const renderContent = () => {
    // Page views (Enrolled Courses, All Courses) - always show list, not course details
    if (currentView === 'enrolledCourses') {
      // Clear any selected course when viewing enrolled courses list
      return <CourseList showAllCourses={false} />;
    }
    
    if (currentView === 'allCourses') {
      // Clear any selected course when viewing all courses list
      return <CourseList showAllCourses={true} />;
    }

    // Course/Channel views - show course details when a course is selected
    if (currentView === 'courseDetails' && isMoodleCourse) {
      // For Moodle courses, show tabs for Chat and Course Details
      return (
        <Tabs defaultValue="details" className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList className="h-12">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Course Details
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Discussion
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resources
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="details" className="flex-1 m-0 overflow-hidden">
            <CourseDetailsView />
          </TabsContent>
          
          <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
            <ChannelArea />
          </TabsContent>
          
          <TabsContent value="files" className="flex-1 m-0 overflow-hidden">
            <CourseDetailsView />
          </TabsContent>
        </Tabs>
      );
    }
    
    // Network groups show channel area
    if (isNetworkGroup) {
      return <ChannelArea />;
    }
    
    // Direct messages show chat area
    if (isDirectMessage) {
      return <ChatArea />;
    }
    
    // Default: Show welcome message
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <BookOpen className="h-20 w-20 mx-auto mb-6 text-primary" />
          <h2 className="text-2xl font-bold mb-3">Welcome to Courses</h2>
          <p className="text-muted-foreground mb-6">
            Select a course from the sidebar to view its content, join discussions, 
            or start a conversation with your classmates.
          </p>
          <div className="grid gap-3 text-left">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <BookOpen className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h3 className="font-semibold text-sm">Moodle Courses</h3>
                <p className="text-xs text-muted-foreground">
                  Access your enrolled courses, view assignments, and download resources
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <MessageSquare className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h3 className="font-semibold text-sm">Network Groups</h3>
                <p className="text-xs text-muted-foreground">
                  Participate in peer-to-peer discussions with network nodes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex h-screen w-full overflow-hidden relative">
      {/* Mobile sidebar toggle button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 z-30 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar - hidden on mobile, shown in sheet */}
      {isMobile ? (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0 sm:w-80">
            <CourseSidebar onChannelSelect={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      ) : (
        <div className="hidden md:block">
          <CourseSidebar />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

function Course() {
  return (
    <CourseProvider>
      <CourseContent />
    </CourseProvider>
  );
}

export default Course;