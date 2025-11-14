use moodle_api::core::message::mark_notification_read;
use moodle_api::core::webservice::get_site_info;
use moodle_client::MoodleClient;
use std::io::{self, Write};

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

    println!("=== MARK NOTIFICATION AS READ ===");
    println!("Current User ID: {}", user_id);
    print!("Enter notification ID to mark as read: ");
    io::stdout().flush().unwrap();

    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();

    let notification_id: i64 = match input.trim().parse() {
        Ok(id) => id,
        Err(_) => {
            println!("Invalid notification ID provided.");
            return;
        }
    };

    println!(
        "Attempting to mark notification {} as read...",
        notification_id
    );

    // Get current timestamp
    let current_time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    // Mark notification as read
    let result = mark_notification_read::call(
        client,
        &mut mark_notification_read::Params {
            notificationid: Some(notification_id),
            timeread: Some(current_time),
        },
    )
    .await;

    match result {
        Ok(response) => {
            println!(
                "Raw API Response: {}",
                serde_json::to_string_pretty(&response).unwrap()
            );

            if let Some(notification_id) = response.notificationid {
                println!(
                    "✅ Notification {} marked as read successfully!",
                    notification_id
                );
            }

            if let Some(warnings) = response.warnings {
                if !warnings.is_empty() {
                    println!("⚠️  Operation completed with warnings:");
                    for (i, warning) in warnings.iter().enumerate() {
                        println!(
                            "  {}. Item: {}",
                            i + 1,
                            warning.item.as_deref().unwrap_or("Unknown")
                        );
                        if let Some(item_id) = warning.itemid {
                            println!("     Item ID: {}", item_id);
                        }
                        if let Some(code) = &warning.warningcode {
                            println!("     Warning Code: {}", code);
                        }
                        if let Some(message) = &warning.message {
                            println!("     Message: {}", message);
                        }
                        println!();
                    }
                } else {
                    println!("✅ No warnings - operation completed successfully!");
                }
            } else {
                println!("✅ Operation completed successfully with no warnings!");
            }
        }
        Err(e) => {
            println!("❌ Error marking notification as read: {}", e);
        }
    }
}
