use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::message::send_instant_messages;

pub async fn send_instant_message_to_user(
    to_user_id: i64,
    message_text: String,
    text_format: Option<i64>,
) -> Result<serde_json::Value> {
    let mut client = login().await?;

    let mut params = send_instant_messages::Params {
        messages: Some(vec![send_instant_messages::ParamsMessagesItem {
            touserid: Some(to_user_id),
            text: Some(message_text),
            textformat: Some(text_format.unwrap_or(1)),
            clientmsgid: None, // Optional field - None is fine
        }]),
    };

    let json = send_instant_messages::call_raw(&mut client, &mut params).await?;
    Ok(json)
}
