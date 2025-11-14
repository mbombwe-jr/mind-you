import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Section from "./Section";
import CourseCard from "./CourseCard";

interface Course {
    id: number;
    fullname: string;
    shortname: string;
    summary?: string;
    categoryid: number;
    categoryname: string;
    visible: boolean;
    format: string;
    startdate: number;
    enddate?: number;
    timemodified: number;
    courseimage?: string;
    progress?: number;
    hasprogress: boolean;
    isfavourite: boolean;
    hidden: boolean;
    timeaccess?: number;
    showshortname: boolean;
    fullnamedisplay: string;
    viewurl: string;
    courseimageurl?: string;
    completionhascriteria: boolean;
    completionusertracked: boolean;
    progresspercent?: number;
    completed: boolean;
    iscourseinfo?: boolean;
    canaccess?: boolean;
}

interface EnrolledCoursesResponse {
    courses: Course[];
    nextoffset: number;
}

interface CourseContent {
    id: number;
    name: string;
    summary?: string;
    modules?: CourseModule[];
}

interface CourseModule {
    id: number;
    name: string;
    summary?: string;
    contents?: ModuleContent[];
}

interface ModuleContent {
    type: string;
    filename?: string;
    filepath?: string;
    filesize?: number;
    fileurl?: string;
    content?: string;
}

function Course() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseContent, setCourseContent] = useState<CourseContent[]>([]);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await invoke<EnrolledCoursesResponse>("get_enrolled_courses");
        console.log(response);
        setCourses(response.courses || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseClick = async (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setSelectedCourse(course);
      setContentLoading(true);
      
      try {
        const contentResponse = await invoke<CourseContent[]>("get_course_content", { courseId });
        console.log(contentResponse);
        setCourseContent(contentResponse || []);
      } catch (err) {
        console.error("Failed to fetch course content:", err);
        setCourseContent([]);
      } finally {
        setContentLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 pt-6 min-h-screen relative flex flex-col items-center justify-center">
        <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-center luckiest-guy-regular text-[#1a1a1a] mb-6">Courses</h1>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a1a]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 pt-6 min-h-screen relative flex flex-col items-center justify-center">
        <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-center luckiest-guy-regular text-[#1a1a1a] mb-6">Courses</h1>
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading courses: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#1a1a1a] text-white rounded hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-6 min-h-screen relative flex flex-col items-center justify-center">
      <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-center luckiest-guy-regular text-[#1a1a1a] mb-6">Courses</h1>
      
      {courses.length > 0 ? (
        <>

          <div className="grid grid-cols-2 gap-4">
            {courses.map(course => (
              <CourseCard 
                key={course.id}
                courseName={course.fullname} 
                courseCode={course.shortname}
                courseId={course.id}
                onClick={handleCourseClick}
              />
            ))}
          </div>

          {selectedCourse && (
            <div className="w-full mt-8 p-6 bg-white rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#1a1a1a]">
                  {selectedCourse.fullname} - {selectedCourse.shortname}
                </h2>
                <button 
                  onClick={() => setSelectedCourse(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
              
              {contentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a1a1a]"></div>
                  <span className="ml-2">Loading course content...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseContent.length > 0 ? (
                    courseContent.map(section => (
                      <Section 
                        key={section.id} 
                        title={section.name} 
                        summary={section.summary || `<p>Section: ${section.name}</p>`} 
                      />
                    ))
                  ) : (
                    <p className="text-gray-500">No course content available.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center">
          <p className="text-gray-500 text-lg">No courses found. Please check your enrollment.</p>
        </div>
      )}
    </div>
  );
}

export default Course;
