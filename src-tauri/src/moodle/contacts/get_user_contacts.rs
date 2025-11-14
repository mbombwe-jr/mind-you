use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::message::get_user_contacts;

pub async fn get_user_contacts_for_user(user_id: i64) -> Result<serde_json::Value> {
    let mut client = login().await?;
    let mut params = get_user_contacts::Params {
        userid: Some(user_id),
        limitfrom: Some(0),
        limitnum: Some(50),
    };
    let json = get_user_contacts::call_raw(&mut client, &mut params).await?;
    Ok(json)
}
