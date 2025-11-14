use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::message::mute_conversations;
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

    // Get user input for conversation IDs
    print!("Enter conversation IDs to mute (comma-separated): ");
    io::stdout().flush().unwrap();

    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();

    let conversation_ids: Vec<i64> = input
        .trim()
        .split(',')
        .filter_map(|s| s.trim().parse::<i64>().ok())
        .collect();

    if conversation_ids.is_empty() {
        println!("No valid conversation IDs provided.");
        return;
    }

    // Mute the conversations
    let result = mute_conversations::call(
        client,
        &mut mute_conversations::Params {
            userid: Some(user_id),
            conversationids: Some(conversation_ids.clone()),
        },
    )
    .await;

    match result {
        Ok(warnings) => {
            if warnings.is_empty() {
                println!(
                    "✅ Conversations {:?} have been successfully muted!",
                    conversation_ids
                );
            } else {
                println!("⚠️ Conversations muted with warnings:");
                for warning in warnings {
                    if let Some(message) = warning.message {
                        println!("  - {}", message);
                    }
                }
            }
        }
        Err(e) => {
            println!("❌ Error muting conversations: {}", e);
        }
    }
}

pub async fn mute_conversations_for_user(
    user_id: i64,
    conversation_ids: Vec<i64>,
) -> Result<serde_json::Value> {
    let mut client = login().await?;
    let mut params = mute_conversations::Params {
        userid: Some(user_id),
        conversationids: Some(conversation_ids),
    };
    mute_conversations::call_raw(&mut client, &mut params)
        .await
        .map_err(|e| e.into())
}
