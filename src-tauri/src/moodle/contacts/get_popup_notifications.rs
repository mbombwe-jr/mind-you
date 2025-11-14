use moodle_api::core::webservice::get_site_info;
use moodle_api::message::popup::get_popup_notifications;
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

    println!("=== GET POPUP NOTIFICATIONS ===");
    println!("Current User ID: {}", user_id);

    let result = get_popup_notifications::call(
        client,
        &mut get_popup_notifications::Params {
            useridto: Some(user_id),
            newestfirst: Some(1),
            limit: Some(50),
            offset: Some(0),
        },
    )
    .await;

    match result {
        Ok(response) => {
            let notifications = response.notifications.unwrap_or_default();
            if notifications.is_empty() {
                println!("No popup notifications found.");
                return;
            }
            println!(
                "=== POPUP NOTIFICATIONS (showing {} of {}) ===",
                notifications.len(),
                response.unreadcount.unwrap_or(0)
            );
            for (i, n) in notifications.iter().enumerate() {
                println!(
                    "{}. {} (ID: {})",
                    i + 1,
                    n.subject.as_deref().unwrap_or("No subject"),
                    n.id.unwrap_or(0)
                );
                println!("   From: {:?} | To: {:?}", n.useridfrom, n.useridto);
                println!(
                    "   Time: {} | Read: {} | Deleted: {}",
                    n.timecreatedpretty.as_deref().unwrap_or("-"),
                    n.read.unwrap_or(false),
                    n.deleted.unwrap_or(false)
                );
                println!("   Message: {}", n.smallmessage.as_deref().unwrap_or(""));
                println!("   Context: {}", n.contexturl.as_deref().unwrap_or(""));
                println!("---");
            }
        }
        Err(e) => {
            // Try to print the raw response if it's a serde_json::Error
            if let Some(serde_err) = e.downcast_ref::<serde_json::Error>() {
                println!("❌ Error parsing response as JSON: {}", serde_err);
                println!("This usually means the API returned a non-JSON value (like 1 or 0). Possible causes:");
                println!("- Invalid or expired token");
                println!("- Insufficient permissions for this web service function");
                println!("- The function is not enabled for your token/user");
                println!("- Server error or misconfiguration");
            } else {
                println!("❌ Error fetching popup notifications: {}", e);
            }
        }
    }
}
