use moodle_api::core::message::mark_all_conversation_messages_as_read;
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

    println!("=== MARK ALL CONVERSATION MESSAGES AS READ ===");
    println!("Current User ID: {}", user_id);
    print!("Enter conversation ID to mark all messages as read: ");
    io::stdout().flush().unwrap();

    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();

    let conversation_id: i64 = match input.trim().parse() {
        Ok(id) => id,
        Err(_) => {
            println!("Invalid conversation ID provided.");
            return;
        }
    };

    println!(
        "Attempting to mark all messages in conversation {} as read...",
        conversation_id
    );

    // Mark all conversation messages as read
    let result = mark_all_conversation_messages_as_read::call(
        client,
        &mut mark_all_conversation_messages_as_read::Params {
            userid: Some(user_id),
            conversationid: Some(conversation_id),
        },
    )
    .await;

    match result {
        Ok(response) => {
            println!(
                "Raw API Response: {}",
                serde_json::to_string_pretty(&response).unwrap()
            );
            println!(
                "✅ All messages in conversation {} marked as read successfully!",
                conversation_id
            );
        }
        Err(e) => {
            println!("❌ Error marking conversation messages as read: {}", e);
        }
    }
}
