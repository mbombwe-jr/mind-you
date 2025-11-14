use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::course::get_enrolled_courses_by_timeline_classification::{call_raw, Params};

pub async fn get_enrolled_course() -> Result<serde_json::Value> {
    let mut client = login().await?;
    let result = call_raw(
        &mut client,
        &mut Params {
            classification: Some("all".to_string()),
            limit: None,  //Some(3),
            offset: None, //Some(0),
            sort: None,
            customfieldname: None,
            customfieldvalue: None,
            searchvalue: None,
        },
    )
    .await;

    Ok(result?)
}

