use moodle_api::core::message::mark_all_notifications_as_read;
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

    println!("=== MARK ALL NOTIFICATIONS AS READ ===");
    println!("Current User ID: {}", user_id);
    println!("Options:");
    println!("1. Mark all notifications as read");
    println!("2. Mark notifications from specific user as read");
    println!("3. Mark notifications created before specific time as read");
    print!("Enter your choice (1-3): ");
    io::stdout().flush().unwrap();

    let mut choice_input = String::new();
    io::stdin().read_line(&mut choice_input).unwrap();
    let choice = choice_input.trim();

    let userid_to = Some(user_id);
    let mut userid_from = None;
    let mut timecreated_to = None;

    match choice {
        "1" => {
            println!("Marking all notifications as read...");
            // userid_to is already set to current user
        }
        "2" => {
            print!("Enter user ID to mark notifications from (0 for any user): ");
            io::stdout().flush().unwrap();
            let mut input = String::new();
            io::stdin().read_line(&mut input).unwrap();
            let from_user_id: i64 = match input.trim().parse() {
                Ok(id) => id,
                Err(_) => {
                    println!("Invalid user ID provided.");
                    return;
                }
            };
            userid_from = Some(from_user_id);
            println!(
                "Marking notifications from user {} as read...",
                from_user_id
            );
        }
        "3" => {
            print!("Enter timestamp (Unix timestamp) to mark notifications created before this time (0 for all): ");
            io::stdout().flush().unwrap();
            let mut input = String::new();
            io::stdin().read_line(&mut input).unwrap();
            let timestamp: i64 = match input.trim().parse() {
                Ok(ts) => ts,
                Err(_) => {
                    println!("Invalid timestamp provided.");
                    return;
                }
            };
            timecreated_to = Some(timestamp);
            println!(
                "Marking notifications created before {} as read...",
                timestamp
            );
        }
        _ => {
            println!("Invalid choice.");
            return;
        }
    }

    // Mark all notifications as read
    let result = mark_all_notifications_as_read::call(
        client,
        &mut mark_all_notifications_as_read::Params {
            useridto: userid_to,
            useridfrom: userid_from,
            timecreatedto: timecreated_to,
        },
    )
    .await;

    match result {
        Ok(response) => {
            println!(
                "Raw API Response: {}",
                serde_json::to_string_pretty(&response).unwrap()
            );
            println!("✅ Notifications marked as read successfully!");
        }
        Err(e) => {
            println!("❌ Error marking notifications as read: {}", e);
        }
    }
}
