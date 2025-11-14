import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Users, Info, ChevronDown, Search, Bell, Sparkles, Hash, Star, LogOut, X, Video, Book } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCourseContext } from "@/contexts/CourseContext";
import { useToast } from "@/hooks/use-toast";
import CallContent from "./pages/CallContent";
import { useState } from "react";
import MembersArea from "./pages/membersArea";

const CourseHeader = () => {
  const { currentCourse, searchTerm, setSearchTerm, toggleMute, currentTab, setCurrentTab } = useCourseContext();
  const { toast } = useToast();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const tabs = [
    { id: 'courseArea', label: 'Course', icon: Book },
    { id: 'infoArea', label: 'Info', icon: Info },
  ];

  return (
    <div className="border-b border-border bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <Hash className="h-4 w-4" />
                {currentCourse?.name || 'Course'}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => console.log('Add to favorites')}>
                <Star className="mr-2 h-4 w-4" />
                Add to favorites
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => console.log('Leave channel')}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => {
              toast({
                title: "Feature Coming Soon",
                description: "AI features will be available in a future update.",
              });
            }}
          >
            <Sparkles className="h-4 w-4 text-primary" />
          </Button>
          {/* REMOVE MEMBERS BUTTON/MODAL HERE */}
          <div className="flex -space-x-2">
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="text-[10px]">JD</AvatarFallback>
            </Avatar>
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="text-[10px]">SM</AvatarFallback>
            </Avatar>
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="text-[10px]">+3</AvatarFallback>
            </Avatar>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => {
              if (currentCourse) {
                toggleMute(currentCourse.id);
                toast({
                  title: currentCourse.isMuted ? "Unmuted" : "Muted",
                  description: currentCourse.isMuted 
                    ? `You will receive notifications from ${currentCourse.name}` 
                    : `You won't receive notifications from ${currentCourse.name}`,
                });
              }
            }}
          >
            <Bell className={`h-4 w-4 ${currentCourse?.isMuted ? 'text-red-500' : ''}`} />
          </Button>
          {isSearchOpen ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-8 h-8 w-64"
                  autoFocus
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchTerm('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
          </Avatar>
        </div>
      </div>
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant="ghost"
              className={`h-10 gap-2 border-b-2 rounded-none hover:bg-transparent ${
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground'
              }`}
              onClick={() => setCurrentTab(tab.id)}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>
      {/* Tab content for Members */}
      {currentTab === 'membersArea' && (
        <div className="w-full flex-1 min-h-0 bg-neutral-900 rounded-b-lg flex flex-col">
          <MembersArea />
        </div>
      )}
      {/* Call Area rendered in-tab */}
      {currentTab === 'callArea' && (
        <div className="w-full flex-1 min-h-0 bg-neutral-900 rounded-b-lg flex flex-col">
          <CallContent />
        </div>
      )}
    </div>
  );
};

export default CourseHeader;

