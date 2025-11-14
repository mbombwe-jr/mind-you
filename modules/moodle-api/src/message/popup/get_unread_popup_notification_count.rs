use serde::{self, Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Params {
    /// the user id who received the message, 0 for any user
    #[serde(rename = "useridto")]
    pub r#useridto: Option<i64>,
}

pub async fn call_raw<'a>(
    client: &'a mut moodle_client::MoodleClient,
    params: &'a mut Params,
) -> anyhow::Result<serde_json::Value> {
    client
        .post("message_popup_get_unread_popup_notification_count", params)
        .await
}