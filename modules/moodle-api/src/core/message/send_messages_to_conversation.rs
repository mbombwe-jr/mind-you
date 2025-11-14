use serde::{self, Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ParamsMessagesItem {
    /// the text of the message
    #[serde(rename = "text")]
    pub r#text: Option<String>,
    /// text format (1 = HTML, 0 = MOODLE, 2 = PLAIN, or 4 = MARKDOWN
    #[serde(rename = "textformat")]
    pub r#textformat: Option<i64>,
}

pub type r#ParamsMessages = Vec<ParamsMessagesItem>;

#[derive(Serialize, Deserialize, Debug)]
pub struct Params {
    /// id of the conversation
    #[serde(rename = "conversationid")]
    pub r#conversationid: Option<i64>,
    #[serde(rename = "messages")]
    pub r#messages: Option<r#ParamsMessages>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ReturnsItem {
    /// The id of the message
    #[serde(rename = "id")]
    pub r#id: Option<i64>,
    /// The id of the user who sent the message
    #[serde(rename = "useridfrom")]
    pub r#useridfrom: Option<i64>,
    /// The text of the message
    #[serde(rename = "text")]
    pub r#text: Option<String>,
    /// The timecreated timestamp for the message
    #[serde(rename = "timecreated")]
    pub r#timecreated: Option<i64>,
}

pub type r#Returns = Vec<ReturnsItem>;

pub async fn call<'a>(
    client: &'a mut moodle_client::MoodleClient,
    params: &'a mut Params,
) -> anyhow::Result<Returns> {
    // Convert the nested structure to a flat HashMap for form submission
    let mut form_params = std::collections::HashMap::new();
    
    if let Some(conversationid) = params.conversationid {
        form_params.insert("conversationid".to_string(), conversationid.to_string());
    }
    
    if let Some(messages) = &params.messages {
        for (i, message) in messages.iter().enumerate() {
            if let Some(text) = &message.text {
                form_params.insert(format!("messages[{}][text]", i), text.clone());
            }
            if let Some(textformat) = message.textformat {
                form_params.insert(format!("messages[{}][textformat]", i), textformat.to_string());
            }
        }
    }
    
    // Debug: Print the form parameters being sent
    println!("=== FORM PARAMETERS ===");
    for (key, value) in &form_params {
        println!("{} = {}", key, value);
    }
    println!("=====================");
    
    let json = client
        .post("core_message_send_messages_to_conversation", &form_params)
        .await?;

    serde_json::from_value(json).map_err(|e| e.into())
}

pub async fn call_raw<'a>(
    client: &'a mut moodle_client::MoodleClient,
    params: &'a mut Params,
) -> anyhow::Result<serde_json::Value> {
    // Convert the nested structure to a flat HashMap for form submission
    let mut form_params = std::collections::HashMap::new();
    
    if let Some(conversationid) = params.conversationid {
        form_params.insert("conversationid".to_string(), conversationid.to_string());
    }
    
    if let Some(messages) = &params.messages {
        for (i, message) in messages.iter().enumerate() {
            if let Some(text) = &message.text {
                form_params.insert(format!("messages[{}][text]", i), text.clone());
            }
            if let Some(textformat) = message.textformat {
                form_params.insert(format!("messages[{}][textformat]", i), textformat.to_string());
            }
        }
    }
    
    // Debug: Print the form parameters being sent
    println!("=== FORM PARAMETERS ===");
    for (key, value) in &form_params {
        println!("{} = {}", key, value);
    }
    println!("=====================");
    
    client
        .post("core_message_send_messages_to_conversation", &form_params)
        .await
}
