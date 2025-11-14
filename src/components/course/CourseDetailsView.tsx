import { useCourseContext } from '@/contexts/CourseContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  ClipboardList, 
  HelpCircle, 
  Users, 
  Calendar, 
  BookOpen,
  Download,
  ExternalLink,
  Loader2,
  Info,
  Layout
} from 'lucide-react';
import Section from './Section';

const CourseDetailsView = () => {
  const { 
    currentCourse, 
    currentCourseContent, 
    currentCourseUsers,
    isLoadingCourseDetails,
    userCourses
  } = useCourseContext();

  // Find full course details
  const courseDetails = userCourses.find(c => c.id === currentCourse?.courseId);

  if (!currentCourse?.courseId) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Course Selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a Moodle course from the sidebar to view its details, files, assignments, and enrolled users.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingCourseDetails) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading course details...</p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Course Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {currentCourse.fullname || currentCourse.name}
              </h1>
              {currentCourse.shortname && (
                <Badge variant="outline" className="text-sm">
                  {currentCourse.shortname}
                </Badge>
              )}
            </div>
            <Badge variant="default">
              Course ID: {currentCourse.courseId}
            </Badge>
          </div>
          
          {courseDetails?.summary && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Course Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="text-sm text-muted-foreground prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: courseDetails.summary }}
                />
              </CardContent>
            </Card>
          )}

          {/* Course Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Start Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {formatDate(courseDetails?.startdate)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  End Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {formatDate(courseDetails?.enddate)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Enrolled Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {currentCourseUsers.length}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Course Content Tabs */}
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Content
              {currentCourseContent?.sections && (
                <Badge variant="secondary" className="ml-1">
                  {currentCourseContent.sections.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Files
              {currentCourseContent?.files && (
                <Badge variant="secondary" className="ml-1">
                  {currentCourseContent.files.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Assignments
              {currentCourseContent?.assignments && (
                <Badge variant="secondary" className="ml-1">
                  {currentCourseContent.assignments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Quizzes
              {currentCourseContent?.quizzes && (
                <Badge variant="secondary" className="ml-1">
                  {currentCourseContent.quizzes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
              <Badge variant="secondary" className="ml-1">
                {currentCourseUsers.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Content Tab - Course Sections */}
          <TabsContent value="content" className="space-y-4 mt-4">
            {!currentCourseContent?.sections || currentCourseContent.sections.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Layout className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No course content sections available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {currentCourseContent.sections.map((section: any, index: number) => {
                  // Transform modules to match Section component's expected format
                  const modules = (section.modules || []).map((module: any) => ({
                    id: module.id || module.instance || index,
                    url: module.url || module.modurl || '#',
                    name: module.name || 'Unnamed Module',
                    modname: module.modname || 'unknown',
                    description: module.description || module.intro || undefined,
                  }));

                  return (
                    <Section
                      key={section.id || index}
                      id={section.id}
                      title={section.name || `Section ${index + 1}`}
                      summary={section.summary || ''}
                      modules={modules}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4 mt-4">
            {!currentCourseContent?.files || currentCourseContent.files.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No files available for this course</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {currentCourseContent.files.map((file: any, index: number) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <FileText className="h-5 w-5 mt-0.5 text-primary" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{file.name || file.filename}</h3>
                            {file.description && (
                              <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                            )}
                            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                              {file.filesize && (
                                <span>{(file.filesize / 1024).toFixed(2)} KB</span>
                              )}
                              {file.mimetype && (
                                <span>{file.mimetype}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                          {file.fileurl && (
                            <Button size="sm" variant="outline" asChild>
                              <a 
                                href={file.fileurl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                title={`Open ${file.name || file.filename || 'file'} in new tab`}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4 mt-4">
            {!currentCourseContent?.assignments || currentCourseContent.assignments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No assignments available for this course</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {currentCourseContent.assignments.map((assignment: any, index: number) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-primary" />
                            {assignment.name}
                          </CardTitle>
                          {assignment.duedate && (
                            <CardDescription className="mt-2">
                              Due: {formatDate(assignment.duedate)}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant={assignment.status === 'submitted' ? 'default' : 'secondary'}>
                          {assignment.status || 'Not Started'}
                        </Badge>
                      </div>
                    </CardHeader>
                    {assignment.intro && (
                      <CardContent>
                        <div 
                          className="text-sm prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: assignment.intro }}
                        />
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-4 mt-4">
            {!currentCourseContent?.quizzes || currentCourseContent.quizzes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <HelpCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No quizzes available for this course</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {currentCourseContent.quizzes.map((quiz: any, index: number) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <HelpCircle className="h-5 w-5 text-primary" />
                            {quiz.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {quiz.timeopen && `Opens: ${formatDate(quiz.timeopen)}`}
                            {quiz.timeclose && ` • Closes: ${formatDate(quiz.timeclose)}`}
                          </CardDescription>
                        </div>
                        {quiz.grade && (
                          <Badge variant="outline">
                            {quiz.grade} points
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    {quiz.intro && (
                      <CardContent>
                        <div 
                          className="text-sm prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: quiz.intro }}
                        />
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-4">
            {currentCourseUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No users enrolled in this course</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentCourseUsers.map((user: any) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          {user.profileimageurlsmall || user.profileimageurl ? (
                            <AvatarImage 
                              src={user.profileimageurlsmall || user.profileimageurl} 
                              alt={user.fullname}
                            />
                          ) : null}
                          <AvatarFallback>
                            {user.fullname?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{user.fullname}</h3>
                          {user.email && (
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          )}
                          {user.roles && user.roles.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {user.roles.slice(0, 2).map((role: any, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {role.name || role.shortname}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};

export default CourseDetailsView;