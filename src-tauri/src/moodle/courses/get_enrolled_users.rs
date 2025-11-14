use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::enrol::get_enrolled_users;

pub async fn get_enrolled_users_for_course(course_id: u32) -> Result<serde_json::Value> {
    let mut client = login().await?;

    let result = get_enrolled_users::call_raw(
        &mut client,
        &mut get_enrolled_users::Params {
            courseid: Some(course_id as i64),
            options: None,
        },
    )
    .await?;

    Ok(result)
}
