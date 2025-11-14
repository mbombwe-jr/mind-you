use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::message::delete_message;

pub async fn delete_message_by_id(message_id: i64, user_id: i64) -> Result<serde_json::Value> {
    let mut client = login().await?;

    let mut params = delete_message::Params {
        messageid: Some(message_id),
        userid: Some(user_id),
        read: None,
    };

    let json = delete_message::call_raw(&mut client, &mut params).await?;
    Ok(json)
}
