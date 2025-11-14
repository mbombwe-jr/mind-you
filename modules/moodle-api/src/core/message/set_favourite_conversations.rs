use serde::{self, Deserialize, Serialize};

pub type r#ParamsConversations = Vec<i64>;

#[derive(Serialize, Deserialize, Debug)]
pub struct Params {
    /// id of the user, 0 for current user
    #[serde(rename = "userid")]
    pub r#userid: Option<i64>,
    #[serde(rename = "conversations")]
    pub r#conversations: Option<r#ParamsConversations>,
}

/// warning
#[derive(Serialize, Deserialize, Debug)]
pub struct ReturnsItem {
    /// item
    #[serde(rename = "item")]
    pub r#item: Option<String>,
    /// item id
    #[serde(rename = "itemid")]
    pub r#itemid: Option<i64>,
    /// the warning code can be used by the client app to implement specific behaviour
    #[serde(rename = "warningcode")]
    pub r#warningcode: Option<String>,
    /// untranslated english message to explain the warning
    #[serde(rename = "message")]
    pub r#message: Option<String>,
}

/// list of warnings
pub type r#Returns = Vec<ReturnsItem>;

pub async fn call<'a>(
    client: &'a mut moodle_client::MoodleClient,
    params: &'a mut Params,
) -> anyhow::Result<Returns> {
    // Convert the parameters to a flat HashMap for form submission
    let mut form_params = std::collections::HashMap::new();
    
    if let Some(userid) = params.userid {
        form_params.insert("userid".to_string(), userid.to_string());
    }
    
    if let Some(conversations) = &params.conversations {
        for (i, conversation_id) in conversations.iter().enumerate() {
            form_params.insert(format!("conversations[{}]", i), conversation_id.to_string());
        }
    }
    
    let json = client
        .post("core_message_set_favourite_conversations", &form_params)
        .await?;

    serde_json::from_value(json).map_err(|e| e.into())
}

pub async fn call_raw<'a>(
    client: &'a mut moodle_client::MoodleClient,
    params: &'a mut Params,
) -> anyhow::Result<serde_json::Value> {
    // Convert the parameters to a flat HashMap for form submission
    let mut form_params = std::collections::HashMap::new();
    
    if let Some(userid) = params.userid {
        form_params.insert("userid".to_string(), userid.to_string());
    }
    
    if let Some(conversations) = &params.conversations {
        for (i, conversation_id) in conversations.iter().enumerate() {
            form_params.insert(format!("conversations[{}]", i), conversation_id.to_string());
        }
    }
    
    client.post("core_message_set_favourite_conversations", &form_params).await
}
