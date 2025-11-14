use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::message::block_user;
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

    // Get user input for blocked user ID
    print!("Enter the user ID to block: ");
    io::stdout().flush().unwrap();

    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let blocked_user_id: i64 = match input.trim().parse() {
        Ok(id) => id,
        Err(_) => {
            println!("Invalid user ID. Please enter a valid number.");
            return;
        }
    };

    // Block the user
    let result = block_user::call(
        client,
        &mut block_user::Params {
            userid: Some(user_id),
            blockeduserid: Some(blocked_user_id),
        },
    )
    .await;

    match result {
        Ok(warnings) => {
            if warnings.is_empty() {
                println!("✅ User {} has been successfully blocked!", blocked_user_id);
            } else {
                println!("⚠️ User blocked with warnings:");
                for warning in warnings {
                    if let Some(message) = warning.message {
                        println!("  - {}", message);
                    }
                }
            }
        }
        Err(e) => {
            println!("❌ Error blocking user: {}", e);
        }
    }
}

pub async fn block_user_for_user(user_id: i64, blocked_user_id: i64) -> Result<serde_json::Value> {
    let mut client = login().await?;
    let mut params = moodle_api::core::message::block_user::Params {
        userid: Some(user_id),
        blockeduserid: Some(blocked_user_id),
    };
    moodle_api::core::message::block_user::call_raw(&mut client, &mut params)
        .await
        .map_err(|e| e.into())
}
