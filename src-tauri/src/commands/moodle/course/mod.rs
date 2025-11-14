use crate::moodle::courses::get_course_files_assignments_questions::get_course_files_assignments_quizzes as inner_get_course_files_assignments_quizzes;
use crate::moodle::courses::get_course_content_items::get_course_content_items as inner_get_course_content_items;
use crate::moodle::courses::get_enrolled_users::get_enrolled_users_for_course as inner_get_enrolled_users_for_course;
use crate::moodle::courses::get_user_courses::get_user_courses as inner_get_user_courses;
use crate::moodle::courses::get_all_courses::get_all_courses as inner_get_all_courses;

/// Get course files, assignments, and quizzes for a given course
#[tauri::command]
pub async fn get_course_files_assignments_quizzes(course_id: u32) -> Result<serde_json::Value, String> {
    inner_get_course_files_assignments_quizzes(course_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get detailed content items for a given course
#[tauri::command]
pub async fn get_course_content_items(course_id: i64) -> Result<serde_json::Value, String> {
    inner_get_course_content_items(course_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get all users enrolled in a specific course
#[tauri::command]
pub async fn get_enrolled_users_for_course(course_id: u32) -> Result<serde_json::Value, String> {
    inner_get_enrolled_users_for_course(course_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get all user courses (timeline-based listing)
#[tauri::command]
pub async fn get_user_courses() -> Result<serde_json::Value, String> {
    inner_get_user_courses()
        .await
        .map_err(|e| e.to_string())
}

/// Get all courses (site-wide)
#[tauri::command]
pub async fn get_all_courses() -> Result<serde_json::Value, String> {
    inner_get_all_courses()
        .await
        .map_err(|e| e.to_string())
}
