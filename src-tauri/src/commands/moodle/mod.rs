use crate::moodle::site::get_site_info::get_current_site_info as inner_get_current_site_info;
use crate::moodle::messages::get_conversations::get_conversations_for_user as inner_get_conversations;
use crate::moodle::messages::get_conversation_messages::get_conversation_messages_for_user as inner_get_conversation_messages;
use crate::moodle::contacts::get_contact_requests::get_contact_requests_for_user as inner_get_contact_requests;
use crate::moodle::contacts::get_user_contacts::get_user_contacts_for_user as inner_get_user_contacts;
use crate::moodle::contacts::search_contacts::search_contacts_by_text as inner_search_contacts;
use crate::moodle::contacts::confirm_contact_request::confirm_contact_request_for_user as inner_confirm_contact_request;
use crate::moodle::contacts::decline_contact_request::decline_contact_request_for_user as inner_decline_contact_request;
use crate::moodle::contacts::create_contact_request::create_contact_request_for_user as inner_create_contact_request;

pub mod dashboard;
pub mod messages;
pub mod course;
pub use dashboard::{get_assignment_count, get_enrolled_course_count};
pub use messages::{send_message, send_instant_message};



#[tauri::command]
pub async fn get_site_info() -> Result<serde_json::Value, String> {
    inner_get_current_site_info()
        .await
        .map(|info| serde_json::to_value(info).unwrap_or(serde_json::Value::Null))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_conversations() -> Result<serde_json::Value, String> {
    // First get the current user ID from site info
    let site_info = inner_get_current_site_info()
        .await
        .map_err(|e| e.to_string())?;
    
    let user_id = site_info.userid;
    
    // Then get conversations for that user
    inner_get_conversations(user_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_conversation_messages(conversation_id: i64, limit_from: Option<i64>, limit_num: Option<i64>) -> Result<serde_json::Value, String> {
    // First get the current user ID from site info
    let site_info = inner_get_current_site_info()
        .await
        .map_err(|e| e.to_string())?;
    
    let user_id = site_info.userid;
    
    // Then get messages for that conversation
    inner_get_conversation_messages(user_id, conversation_id, limit_from, limit_num)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_contact_requests() -> Result<serde_json::Value, String> {
    // First get the current user ID from site info
    let site_info = inner_get_current_site_info()
        .await
        .map_err(|e| e.to_string())?;
    
    let user_id = site_info.userid;
    
    // Then get contact requests for that user
    inner_get_contact_requests(user_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_user_contacts() -> Result<serde_json::Value, String> {
    // First get the current user ID from site info
    let site_info = inner_get_current_site_info()
        .await
        .map_err(|e| e.to_string())?;
    
    let user_id = site_info.userid;
    
    // Then get user contacts for that user
    inner_get_user_contacts(user_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_contacts(search_text: String, only_my_courses: Option<i64>) -> Result<serde_json::Value, String> {
    inner_search_contacts(search_text, only_my_courses)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn confirm_contact_request(requested_user_id: i64) -> Result<serde_json::Value, String> {
    // Confirm the contact request - Moodle will use the logged-in user automatically
    inner_confirm_contact_request(requested_user_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn decline_contact_request(requested_user_id: i64) -> Result<serde_json::Value, String> {
    // Decline the contact request - Moodle will use the logged-in user automatically
    inner_decline_contact_request(requested_user_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_contact_request(requested_user_id: i64) -> Result<serde_json::Value, String> {
    // Create a contact request - Moodle will use the logged-in user automatically
    inner_create_contact_request(requested_user_id)
        .await
        .map_err(|e| e.to_string())
}
