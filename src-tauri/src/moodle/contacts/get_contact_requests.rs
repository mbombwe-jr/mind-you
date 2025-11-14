use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::message::get_contact_requests;

pub async fn get_contact_requests_for_user(user_id: i64) -> Result<serde_json::Value> {
    let mut client = login().await?;
    let mut params = get_contact_requests::Params {
        userid: Some(user_id),
        limitfrom: Some(0),
        limitnum: Some(50),
    };
    let json = get_contact_requests::call_raw(&mut client, &mut params).await?;
    Ok(json)
}
