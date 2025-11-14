use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::message::get_conversation_messages;

pub async fn get_conversation_messages_for_user(
    user_id: i64,
    conversation_id: i64,
    limit_from: Option<i64>,
    limit_num: Option<i64>,
) -> Result<serde_json::Value> {
    let mut client = login().await?;

    let mut params = get_conversation_messages::Params {
        currentuserid: Some(user_id),
        convid: Some(conversation_id),
        limitfrom: limit_from,
        limitnum: limit_num,
        newest: None,
        timefrom: None,
    };

    let json = get_conversation_messages::call_raw(&mut client, &mut params).await?;
    Ok(json)
}
