import { useState, useMemo } from 'react';
import CourseCard from "./CourseCard";
import { useCourseContext } from "@/contexts/CourseContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import CourseDetailsView from "./CourseDetailsView";
import CourseListHeader from "./CourseListHeader";
import { Search, Filter, X } from 'lucide-react';

interface CourseListProps {
  showAllCourses?: boolean;
}

function CourseList({ showAllCourses = false }: CourseListProps) {
  const { 
    currentCourse, 
    setCurrentCourse,
    setCurrentView,
    currentView,
    userCourses,
    allCourses,
    isLoadingCourses,
  } = useCourseContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'code', 'recent'
  const [showFilters, setShowFilters] = useState(false);
  
  // Use allCourses if showAllCourses is true, otherwise use userCourses
  const coursesToShow = showAllCourses ? allCourses : userCourses;

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = coursesToShow.filter(course => {
      const searchLower = searchQuery.toLowerCase();
      return (
        course.fullname.toLowerCase().includes(searchLower) ||
        course.shortname.toLowerCase().includes(searchLower)
      );
    });

    // Sort courses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fullname.localeCompare(b.fullname);
        case 'code':
          return a.shortname.localeCompare(b.shortname);
        case 'recent':
          return (b.startdate || 0) - (a.startdate || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [coursesToShow, searchQuery, sortBy]);

  // Only show course details if we're explicitly in courseDetails view
  // Otherwise, always show the list when viewing enrolledCourses or allCourses
  if (currentView === 'courseDetails' && currentCourse?.courseId) {
    return <CourseDetailsView />;
  }

  const handleCourseClick = (courseId: number, courseName: string, courseCode: string) => {
    // Find the course in the appropriate list
    const course = coursesToShow.find(c => c.id === courseId);
    if (course) {
      // Convert to Course format and set as current course
      const courseChannel = {
        id: `course_${course.id}`,
        name: course.shortname || course.fullname,
        fullname: course.fullname,
        shortname: course.shortname,
        type: 'channel' as const,
        courseId: course.id,
        summary: course.summary,
        startdate: course.startdate,
        enddate: course.enddate,
      };
      setCurrentCourse(courseChannel);
      setCurrentView('courseDetails');
    }
  };

  if (isLoadingCourses) {
    return (
      <div className="w-full h-full flex flex-col ">
        <CourseListHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          totalCourses={coursesToShow.length}
          filteredCount={filteredAndSortedCourses.length}
          showAllCourses={showAllCourses}
        />
      
      <div className="w-full h-full flex flex-col items-center justify-center ">

        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a1a]"></div>
        </div>
      </div></div>
    );
  }

  return (
    <ScrollArea className="w-full h-full">
        <CourseListHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          totalCourses={coursesToShow.length}
          filteredCount={filteredAndSortedCourses.length}
          showAllCourses={showAllCourses}
        />
      <div className="w-full max-w-6xl mx-auto px-4 pt-2 pb-16">

        
        {filteredAndSortedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-w-6xl mx-auto">
            {filteredAndSortedCourses.map(course => (
              <CourseCard 
                key={course.id}
                courseName={course.fullname} 
                courseCode={course.shortname}
                courseId={course.id}
                onClick={handleCourseClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">
              {searchQuery 
                ? `No courses found matching "${searchQuery}"` 
                : (showAllCourses 
                    ? 'No courses available.' 
                    : 'No courses found. Please check your enrollment.')}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-500 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export default CourseList;