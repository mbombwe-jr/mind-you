use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::message::search_contacts;

pub async fn search_contacts_by_text(
    search_text: String,
    only_my_courses: Option<i64>,
) -> Result<serde_json::Value> {
    let mut client = login().await?;

    let mut params = search_contacts::Params {
        searchtext: Some(search_text),
        onlymycourses: Some(only_my_courses.unwrap_or(0)), // Default to search all courses
    };

    let json = search_contacts::call_raw(&mut client, &mut params).await?;
    Ok(json)
}
