use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::message::get_conversations;

pub async fn get_conversations_for_user(user_id: i64) -> Result<serde_json::Value> {
    let mut client = login().await?;
    let mut params = get_conversations::Params {
        userid: Some(user_id),
        limitfrom: None,
        limitnum: None,
        r#type: None,
        favourites: None,
        mergeself: Some(1),
    };
    let json = get_conversations::call_raw(&mut client, &mut params).await?;
    Ok(json)
}
