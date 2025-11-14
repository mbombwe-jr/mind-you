import CourseCard from "./CourseCard";
import { useCourseContext } from "@/contexts/CourseContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import CourseDetailsView from "./CourseDetailsView";

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
  
  // Use allCourses if showAllCourses is true, otherwise use userCourses
  const coursesToShow = showAllCourses ? allCourses : userCourses;

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
      <div className="w-full h-full flex flex-col items-center justify-center">
        <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-center luckiest-guy-regular text-[#1a1a1a] mb-6">Courses</h1>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a1a]"></div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full h-full">
      <div className="w-full max-w-6xl mx-auto px-4 pt-6 pb-6">
        <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-center luckiest-guy-regular text-[#1a1a1a] mb-6">
          {showAllCourses ? 'All Courses' : 'Enrolled Courses'}
        </h1>
        
        {coursesToShow.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {coursesToShow.map(course => (
                <CourseCard 
                  key={course.id}
                  courseName={course.fullname} 
                  courseCode={course.shortname}
                  courseId={course.id}
                  onClick={handleCourseClick}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 text-lg">
              {showAllCourses 
                ? 'No courses available.' 
                : 'No courses found. Please check your enrollment.'}
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export default CourseList;
