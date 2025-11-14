use anyhow::Result;
use moodle_api::core::message::confirm_contact_request;
use crate::moodle::site::get_site_info::get_current_site_info;


pub async fn confirm_contact_request_for_user(
    requested_user_id: i64,
) -> Result<serde_json::Value> {
    // Get the current user ID from site info
    let site_info = get_current_site_info().await?;
    let current_user_id = site_info.userid;
    
    let mut client = crate::moodle::calendar::login().await?;
    let mut params = confirm_contact_request::Params {
        userid: Some(requested_user_id),
        requesteduserid: Some(current_user_id),
    };
    let json = confirm_contact_request::call_raw(&mut client, &mut params).await?;
    println!("Confirm contact request: {:?}", json);
    Ok(json)
}
