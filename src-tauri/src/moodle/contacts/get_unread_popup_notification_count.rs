use moodle_api::core::webservice::get_site_info;
use moodle_api::message::popup::get_unread_popup_notification_count;
use moodle_client::MoodleClient;

pub async fn run(client: &mut MoodleClient) {
    // Get current user id
    let user_id = match get_site_info::call_raw(
        client,
        &mut get_site_info::Params {
            serviceshortnames: None,
        },
    )
    .await
    {
        Ok(site_info) => site_info.get("userid").and_then(|v| v.as_i64()),
        Err(e) => {
            println!("Could not fetch current user id: {}", e);
            return;
        }
    };
    let user_id = match user_id {
        Some(id) => id,
        None => {
            println!("Could not extract user id from site info.");
            return;
        }
    };
    println!("=== GET UNREAD POPUP NOTIFICATION COUNT ===");
    println!("Current User ID: {}", user_id);
    let result = get_unread_popup_notification_count::call_raw(
        client,
        &mut get_unread_popup_notification_count::Params {
            useridto: Some(user_id),
        },
    )
    .await;
    match result {
        Ok(json) => {
            println!(
                "Raw API Response: {}",
                serde_json::to_string_pretty(&json).unwrap()
            );
            if let Some(count) = json.get("unreadcount").and_then(|v| v.as_i64()) {
                println!("Unread popup notification count: {}", count);
            } else if json.is_number() {
                println!("Unread popup notification count: {}", json);
            } else {
                println!("Could not extract unread count from response.");
            }
        }
        Err(e) => {
            println!("❌ Error fetching unread popup notification count: {}", e);
        }
    }
}
