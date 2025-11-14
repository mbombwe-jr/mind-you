use serde::{self, Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Params {
    /// The user id who who we are marking the messages as read for
    #[serde(rename = "userid")]
    pub r#userid: Option<i64>,
    /// The conversation id who who we are marking the messages as read for
    #[serde(rename = "conversationid")]
    pub r#conversationid: Option<i64>,
}

pub type Returns = serde_json::Value;

pub async fn call<'a>(
    client: &'a mut moodle_client::MoodleClient,
    params: &'a mut Params,
) -> anyhow::Result<Returns> {
    let json = client
        .post("core_message_mark_all_conversation_messages_as_read", params)
        .await?;

    serde_json::from_value(json).map_err(|e| e.into())
}

pub async fn call_raw<'a>(
    client: &'a mut moodle_client::MoodleClient,
    params: &'a mut Params,
) -> anyhow::Result<serde_json::Value> {
    client
        .post("core_message_mark_all_conversation_messages_as_read", params)
        .await
}