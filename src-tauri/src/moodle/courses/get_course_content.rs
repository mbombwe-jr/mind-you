use crate::moodle::calendar::login;
use anyhow::Result;
use moodle_api::core::course::get_contents;

pub async fn get_course_content(course_id: u32) -> Result<serde_json::Value> {
    let mut client = login().await?;
    let content_result = get_contents::call_raw(
        &mut client,
        &mut get_contents::Params {
            courseid: Some(course_id as i64),
            options: None,
        },
    )
    .await?;
    Ok(content_result)
}
