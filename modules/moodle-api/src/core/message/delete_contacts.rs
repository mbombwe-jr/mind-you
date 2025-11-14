use serde::{self, Deserialize, Serialize};

/// List of user IDs
pub type r#ParamsUserids = Vec<i64>;

#[derive(Serialize, Deserialize, Debug)]
pub struct Params {
    /// List of user IDs
    #[serde(rename = "userids")]
    pub r#userids: Option<r#ParamsUserids>,
    /// The id of the user we are deleting the contacts for, 0 for the current user
    #[serde(rename = "userid")]
    pub r#userid: Option<i64>,
}

pub type Returns = serde_json::Value;

pub async fn call<'a>(
    client: &'a mut moodle_client::MoodleClient,
    params: &'a mut Params,
) -> anyhow::Result<Returns> {
    let json = client.post("core_message_delete_contacts", params).await?;

    serde_json::from_value(json).map_err(|e| e.into())
}

pub async fn call_raw<'a>(
    client: &'a mut moodle_client::MoodleClient,
    params: &'a mut Params,
) -> anyhow::Result<serde_json::Value> {
    client.post("core_message_delete_contacts", params).await
}