use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::course::get_enrolled_courses_by_timeline_classification;

pub async fn get_user_courses() -> Result<serde_json::Value> {
    let mut client = login().await?;
    let mut params = get_enrolled_courses_by_timeline_classification::Params {
        classification: Some("all".to_string()),
        limit: None,
        offset: None,
        sort: None,
        customfieldname: None,
        customfieldvalue: None,
        searchvalue: None,
    };
    let result =
        get_enrolled_courses_by_timeline_classification::call_raw(&mut client, &mut params).await?;
    Ok(result)
}
