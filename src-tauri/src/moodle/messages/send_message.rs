use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::message::send_messages_to_conversation;

pub async fn send_message_to_conversation(
    conversation_id: i64,
    message_text: String,
    text_format: Option<i64>,
) -> Result<serde_json::Value> {
    let mut client = login().await?;

    let mut params = send_messages_to_conversation::Params {
        conversationid: Some(conversation_id),
        messages: Some(vec![send_messages_to_conversation::ParamsMessagesItem {
            text: Some(message_text),
            textformat: Some(text_format.unwrap_or(1)), // Default to HTML format
        }]),
    };

    let json = send_messages_to_conversation::call_raw(&mut client, &mut params).await?;
    Ok(json)
}
