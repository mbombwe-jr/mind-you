use crate::moodle::messages::send_message::send_message_to_conversation as inner_send_message;
use crate::moodle::messages::send_instant_message::send_instant_message_to_user as inner_send_instant_message;

#[tauri::command]
pub async fn send_message(
    conversation_id: i64,
    message_text: String,
    text_format: Option<i64>,
) -> Result<serde_json::Value, String> {
    inner_send_message(conversation_id, message_text, text_format)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn send_instant_message(
    to_user_id: i64,
    message_text: String,
) -> Result<serde_json::Value, String> {
    // Always use HTML format (1) for instant messages
    inner_send_instant_message(to_user_id, message_text, Some(1))
        .await
        .map_err(|e| e.to_string())
}

