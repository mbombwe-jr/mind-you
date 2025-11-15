import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, ChevronDown, BookOpen, Grid, List } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CourseListHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  totalCourses: number;
  filteredCount: number;
  showAllCourses?: boolean;
}

const CourseListHeader = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  totalCourses,
  filteredCount,
  showAllCourses = false
}: CourseListHeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const sortOptions = [
    { id: 'name', label: 'Sort by Name' },
    { id: 'code', label: 'Sort by Code' },
    { id: 'recent', label: 'Most Recent' }
  ];

  const currentSortLabel = sortOptions.find(opt => opt.id === sortBy)?.label || 'Sort';

  return (
    <div className="border-b border-border bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">
              {showAllCourses ? 'All Courses' : 'My Courses'}
            </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filter/Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <Filter className="h-4 w-4" />
                {currentSortLabel}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => setSortBy(option.id)}
                  className={sortBy === option.id ? 'bg-accent' : ''}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search */}
          {isSearchOpen ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-8 h-8 w-64"
                  autoFocus
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchQuery('')}
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
                  setSearchQuery('');
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
        </div>
      </div>

      {/* Results Count Bar */}
      <div className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground">
        <span>
          Showing {filteredCount} of {totalCourses} courses
        </span>
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setSearchQuery('')}
          >
            Clear search
          </Button>
        )}
      </div>
    </div>
  );
};

export default CourseListHeader;