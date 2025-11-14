use crate::moodle::calendar::login;
use anyhow::Result;
use moodle_api::core::course::get_course_content_items;

/// Fetch course content items for a given course ID.
/// Returns serde_json::Value or an error.
pub async fn get_course_content_items(course_id: i64) -> Result<serde_json::Value> {
    let mut client = login().await?;
    let result = get_course_content_items::call_raw(
        &mut client,
        &mut get_course_content_items::Params {
            r#courseid: Some(course_id),
        },
    )
    .await;

    Ok(result?)
}

