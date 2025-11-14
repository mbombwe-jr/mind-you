use crate::moodle::courses::get_course_files_assignments_questions::get_course_files_assignments_quizzes as inner_get_course_files_assignments_quizzes;
use crate::moodle::courses::get_enrolled_course::get_enrolled_course as inner_get_enrolled_course;

/// Get the count of assignments across all courses
/// This function fetches all enrolled courses and counts assignments in each
#[tauri::command]
pub async fn get_assignment_count() -> Result<u32, String> {
    // First, get all enrolled courses
    let enrolled_courses_result = inner_get_enrolled_course()
        .await
        .map_err(|e| e.to_string())?;

    let mut total_assignments = 0u32;

    // Extract course IDs from enrolled courses
    if let Some(courses) = enrolled_courses_result.get("courses").and_then(|c| c.as_array()) {
        for course in courses {
            if let Some(course_id) = course.get("id").and_then(|id| id.as_u64()) {
                // Get assignments for this course
                match inner_get_course_files_assignments_quizzes(course_id as u32).await {
                    Ok(result) => {
                        // Extract assignment count from the result
                        if let Some(summary) = result.get("summary") {
                            if let Some(count) = summary.get("total_assignments").and_then(|c| c.as_u64()) {
                                total_assignments += count as u32;
                            }
                        }
                    }
                    Err(_) => {
                        // Skip courses that fail, continue with others
                        continue;
                    }
                }
            }
        }
    }

    Ok(total_assignments)
}

/// Get the count of enrolled courses
#[tauri::command]
pub async fn get_enrolled_course_count() -> Result<u32, String> {
    let enrolled_courses_result = inner_get_enrolled_course()
        .await
        .map_err(|e| e.to_string())?;

    let count = if let Some(courses) = enrolled_courses_result.get("courses").and_then(|c| c.as_array()) {
        courses.len() as u32
    } else {
        0u32
    };

    Ok(count)
}

