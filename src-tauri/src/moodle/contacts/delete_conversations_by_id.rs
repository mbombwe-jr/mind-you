use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::message::delete_conversations_by_id;
use moodle_api::core::webservice::get_site_info;
use moodle_client::MoodleClient;
use std::collections::HashMap;
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

    println!("=== DELETE CONVERSATIONS BY ID ===");
    println!("Current User ID: {}", user_id);
    print!("Enter conversation IDs to delete (comma-separated): ");
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

    println!("Attempting to delete conversations: {:?}", conversation_ids);

    // Create form parameters manually for proper array serialization
    let mut form_params = HashMap::new();
    form_params.insert("userid".to_string(), user_id.to_string());
    for (i, conv_id) in conversation_ids.iter().enumerate() {
        form_params.insert(format!("conversationids[{}]", i), conv_id.to_string());
    }

    // Use the client directly for the POST
    let result = client
        .post("core_message_delete_conversations_by_id", &form_params)
        .await;

    match result {
        Ok(response) => {
            println!(
                "Raw API Response: {}",
                serde_json::to_string_pretty(&response).unwrap()
            );

            // Try to parse the response as warnings
            if let Ok(warnings) = serde_json::from_value::<
                Vec<delete_conversations_by_id::ReturnsItem>,
            >(response.clone())
            {
                if warnings.is_empty() {
                    println!("✅ Conversations deleted successfully with no warnings!");
                } else {
                    println!("⚠️  Deletion completed with warnings:");
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
                }
            } else {
                // If parsing as warnings fails, show raw response
                println!(
                    "Response (could not parse as warnings): {}",
                    serde_json::to_string_pretty(&response).unwrap()
                );
            }
        }
        Err(e) => {
            println!("❌ Error deleting conversations: {}", e);
        }
    }
}

pub async fn delete_conversations_by_id_for_user(
    user_id: i64,
    conversation_ids: Vec<i64>,
) -> Result<serde_json::Value> {
    let client = login().await?;
    let mut form_params = HashMap::new();
    form_params.insert("userid".to_string(), user_id.to_string());
    for (i, conv_id) in conversation_ids.iter().enumerate() {
        form_params.insert(format!("conversationids[{}]", i), conv_id.to_string());
    }
    let json = client
        .post("core_message_delete_conversations_by_id", &form_params)
        .await?;
    Ok(json)
}
