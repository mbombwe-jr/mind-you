use crate::moodle::calendar::login;
use anyhow::Result;
use moodle_api::core::course::get_contents;
use std::collections::HashMap;

pub async fn get_course_files_assignments_quizzes(course_id: u32) -> Result<serde_json::Value> {
    let mut client = login().await?;

    // Get course contents (files, modules, etc.)
    let contents_result = get_contents::call(
        &mut client,
        &mut get_contents::Params {
            courseid: Some(course_id as i64),
            options: None,
        },
    )
    .await?;

    // Get assignments
    let mut assignment_params = HashMap::new();
    assignment_params.insert("courseids[0]".to_string(), course_id.to_string());
    assignment_params.insert("includenotenrolledcourses".to_string(), "0".to_string());

    let assignments_result = client
        .post("mod_assign_get_assignments", &assignment_params)
        .await?;

    // Get quizzes
    let mut quiz_params = HashMap::new();
    quiz_params.insert("courseids[0]".to_string(), course_id.to_string());

    let quizzes_result = client
        .post("mod_quiz_get_quizzes_by_courses", &quiz_params)
        .await?;

    // Process and group the data
    let mut files = Vec::new();
    let mut assignments = Vec::new();
    let mut quizzes = Vec::new();

    // Process course contents for files
    // Convert the API response to JSON first to work with it
    let contents_json = serde_json::to_value(&contents_result).unwrap_or(serde_json::Value::Null);

    if let Some(contents_array) = contents_json.as_array() {
        for section in contents_array {
            if let Some(modules_array) = section.get("modules").and_then(|m| m.as_array()) {
                for module in modules_array {
                    if let Some(modname) = module.get("modname").and_then(|n| n.as_str()) {
                        match modname {
                            "resource" | "file" => {
                                // Extract file information
                                if let Some(contents_array) =
                                    module.get("contents").and_then(|c| c.as_array())
                                {
                                    for content in contents_array {
                                        if let Some(fileurl) =
                                            content.get("fileurl").and_then(|u| u.as_str())
                                        {
                                            files.push(serde_json::json!({
                                                "id": content.get("timemodified").unwrap_or(&serde_json::Value::Null),
                                                "name": content.get("filename").unwrap_or(&serde_json::Value::Null),
                                                "type": "file",
                                                "url": fileurl,
                                                "size": content.get("filesize").unwrap_or(&serde_json::Value::Null),
                                                "modified": content.get("timemodified").unwrap_or(&serde_json::Value::Null)
                                            }));
                                        }
                                    }
                                }
                            }
                            "assign" => {
                                // Extract assignment information
                                if let Some(instance) =
                                    module.get("instance").and_then(|i| i.as_i64())
                                {
                                    assignments.push(serde_json::json!({
                                        "id": instance,
                                        "name": module.get("name").unwrap_or(&serde_json::Value::Null),
                                        "type": "assignment",
                                        "description": module.get("description").unwrap_or(&serde_json::Value::Null),
                                        "duedate": module.get("duedate").unwrap_or(&serde_json::Value::Null),
                                        "timemodified": module.get("timemodified").unwrap_or(&serde_json::Value::Null)
                                    }));
                                }
                            }
                            "quiz" => {
                                // Extract quiz information
                                if let Some(instance) =
                                    module.get("instance").and_then(|i| i.as_i64())
                                {
                                    quizzes.push(serde_json::json!({
                                        "id": instance,
                                        "name": module.get("name").unwrap_or(&serde_json::Value::Null),
                                        "type": "quiz",
                                        "description": module.get("description").unwrap_or(&serde_json::Value::Null),
                                        "timeopen": module.get("timeopen").unwrap_or(&serde_json::Value::Null),
                                        "timeclose": module.get("timeclose").unwrap_or(&serde_json::Value::Null),
                                        "timemodified": module.get("timemodified").unwrap_or(&serde_json::Value::Null)
                                    }));
                                }
                            }
                            _ => {}
                        }
                    }
                }
            }
        }
    }

    // Process API assignments
    if let Some(assignments_data) = assignments_result.get("courses").and_then(|c| c.as_array()) {
        for course in assignments_data {
            if let Some(assignments_list) = course.get("assignments").and_then(|a| a.as_array()) {
                for assignment in assignments_list {
                    assignments.push(serde_json::json!({
                        "id": assignment.get("id").unwrap_or(&serde_json::Value::Null),
                        "name": assignment.get("name").unwrap_or(&serde_json::Value::Null),
                        "type": "assignment",
                        "description": assignment.get("intro").unwrap_or(&serde_json::Value::Null),
                        "duedate": assignment.get("duedate").unwrap_or(&serde_json::Value::Null),
                        "timemodified": assignment.get("timemodified").unwrap_or(&serde_json::Value::Null),
                        "grade": assignment.get("grade").unwrap_or(&serde_json::Value::Null)
                    }));
                }
            }
        }
    }

    // Process API quizzes
    if let Some(quizzes_data) = quizzes_result.get("quizzes").and_then(|q| q.as_array()) {
        for quiz in quizzes_data {
            quizzes.push(serde_json::json!({
                "id": quiz.get("id").unwrap_or(&serde_json::Value::Null),
                "name": quiz.get("name").unwrap_or(&serde_json::Value::Null),
                "type": "quiz",
                "description": quiz.get("intro").unwrap_or(&serde_json::Value::Null),
                "timeopen": quiz.get("timeopen").unwrap_or(&serde_json::Value::Null),
                "timeclose": quiz.get("timeclose").unwrap_or(&serde_json::Value::Null),
                "timemodified": quiz.get("timemodified").unwrap_or(&serde_json::Value::Null),
                "grade": quiz.get("grade").unwrap_or(&serde_json::Value::Null)
            }));
        }
    }

    // Combine all results in organized groups
    let combined_result = serde_json::json!({
        "groups": {
            "files": {
                "title": "Files & Resources",
                "items": files,
                "count": files.len()
            },
            "assignments": {
                "title": "Assignments",
                "items": assignments,
                "count": assignments.len()
            },
            "quizzes": {
                "title": "Quizzes & Tests",
                "items": quizzes,
                "count": quizzes.len()
            }
        },
        "summary": {
            "total_files": files.len(),
            "total_assignments": assignments.len(),
            "total_quizzes": quizzes.len(),
            "total_items": files.len() + assignments.len() + quizzes.len()
        }
    });

    Ok(combined_result)
}

fn format_file_size(size: Option<i64>) -> String {
    match size {
        Some(bytes) => {
            if bytes < 1024 {
                format!("{} B", bytes)
            } else if bytes < 1024 * 1024 {
                format!("{:.1} KB", bytes as f64 / 1024.0)
            } else {
                format!("{:.1} MB", bytes as f64 / (1024.0 * 1024.0))
            }
        }
        None => "Unknown size".to_string(),
    }
}

fn format_timestamp(timestamp: i64) -> String {
    use chrono::{DateTime, Utc};
    let dt = DateTime::from_timestamp(timestamp, 0).unwrap_or_else(|| Utc::now());
    dt.format("%Y-%m-%d %H:%M:%S").to_string()
}
