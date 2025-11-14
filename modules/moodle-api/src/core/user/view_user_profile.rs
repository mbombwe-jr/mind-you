use serde::{self, Deserialize, Serialize};

fn string_or_int_to_string<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::Error;
    use serde_json::Value;
    let val = Value::deserialize(deserializer)?;
    match val {
        Value::String(s) => Ok(Some(s)),
        Value::Number(n) => Ok(Some(n.to_string())),
        Value::Null => Ok(None),
        _ => Err(D::Error::custom("expected string or integer or null")),
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Params {
    /// id of the user, 0 for current user
    #[serde(rename = "userid")]
    pub r#userid: Option<i64>,
    /// id of the course, default site course
    #[serde(rename = "courseid")]
    pub r#courseid: Option<i64>,
}

/// warning
#[derive(Serialize, Deserialize, Debug)]
pub struct ReturnsWarningsItem {
    /// item
    #[serde(rename = "item", default, deserialize_with = "string_or_int_to_string")]
    pub r#item: Option<String>,
    /// item id
    #[serde(rename = "itemid")]
    pub r#itemid: Option<i64>,
    /// the warning code can be used by the client app to implement specific behaviour
    #[serde(rename = "warningcode", default, deserialize_with = "string_or_int_to_string")]
    pub r#warningcode: Option<String>,
    /// untranslated english message to explain the warning
    #[serde(rename = "message", default, deserialize_with = "string_or_int_to_string")]
    pub r#message: Option<String>,
}

/// list of warnings
pub type r#ReturnsWarnings = Vec<ReturnsWarningsItem>;

#[derive(Serialize, Deserialize, Debug)]
pub struct Returns {
    /// status: true if success
    #[serde(rename = "status")]
    pub r#status: Option<bool>,
    /// list of warnings
    #[serde(rename = "warnings")]
    pub r#warnings: Option<r#ReturnsWarnings>,
}

pub async fn call<'a>(
    client: &'a mut moodle_client::MoodleClient,
    params: &'a mut Params,
) -> anyhow::Result<Returns> {
    let json = client.post("core_user_view_user_profile", params).await?;

    serde_json::from_value(json).map_err(|e| e.into())
}

pub async fn call_raw<'a>(
    client: &'a mut moodle_client::MoodleClient,
    params: &'a mut Params,
) -> anyhow::Result<serde_json::Value> {
    client.post("core_user_view_user_profile", params).await
}
