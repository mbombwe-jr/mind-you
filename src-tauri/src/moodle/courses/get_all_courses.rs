use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::course::get_courses_by_field;

pub async fn get_all_courses() -> Result<serde_json::Value> {
    let mut client = login().await?;
    let mut params = get_courses_by_field::Params {
        field: None,
        value: None,
    };
    let result = get_courses_by_field::call_raw(&mut client, &mut params).await?;
    Ok(result)
}
