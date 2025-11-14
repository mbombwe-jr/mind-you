use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::message::create_contact_request;

// Add this function for Tauri command usage
// Note: userid should be None to use the logged-in user automatically
pub async fn create_contact_request_for_user(
    requested_user_id: i64,
) -> Result<serde_json::Value> {
    let mut client = login().await?;
    let mut params = create_contact_request::Params {
        userid: None, // Let Moodle use the logged-in user automatically
        requesteduserid: Some(requested_user_id),
    };
    let json = create_contact_request::call_raw(&mut client, &mut params).await?;
    Ok(json)
}
