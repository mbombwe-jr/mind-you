use moodle_api::core::message::get_member_info;
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

    // Get user input for user IDs to get info about
    print!("Enter user IDs to get member info (comma-separated): ");
    io::stdout().flush().unwrap();

    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();

    let target_user_ids: Vec<i64> = input
        .trim()
        .split(',')
        .filter_map(|s| s.trim().parse::<i64>().ok())
        .collect();

    if target_user_ids.is_empty() {
        println!("No valid user IDs provided.");
        return;
    }

    // Create form parameters manually for proper array serialization
    let mut form_params = HashMap::new();
    form_params.insert("referenceuserid".to_string(), user_id.to_string());
    for (i, uid) in target_user_ids.iter().enumerate() {
        form_params.insert(format!("userids[{}]", i), uid.to_string());
    }
    form_params.insert("includecontactrequests".to_string(), "1".to_string());
    form_params.insert("includeprivacyinfo".to_string(), "1".to_string());

    // Use the client directly for the POST
    let result = client
        .post("core_message_get_member_info", &form_params)
        .await;

    match result {
        Ok(response) => {
            println!(
                "Raw API Response: {}",
                serde_json::to_string_pretty(&response).unwrap()
            );

            // Try to parse the response
            let member_info: Vec<get_member_info::ReturnsItem> =
                match serde_json::from_value(response) {
                    Ok(data) => data,
                    Err(e) => {
                        println!("❌ Error parsing response: {}", e);
                        return;
                    }
                };

            if member_info.is_empty() {
                println!("No member information found for the provided user IDs.");
                return;
            }

            println!("=== MEMBER INFORMATION ===");
            println!("Total members: {}", member_info.len());
            println!("========================");

            for (i, member) in member_info.iter().enumerate() {
                let member_id = member.id.unwrap_or(0);
                let fullname = member.fullname.as_deref().unwrap_or("Unknown");
                let profile_url = member.profileurl.as_deref().unwrap_or("");
                let profile_image = member.profileimageurl.as_deref().unwrap_or("");
                let is_online = member.isonline.unwrap_or(false);
                let show_online_status = member.showonlinestatus.unwrap_or(false);
                let is_blocked = member.isblocked.unwrap_or(false);
                let is_contact = member.iscontact.unwrap_or(false);
                let is_deleted = member.isdeleted.unwrap_or(false);
                let can_message_even_if_blocked = member.canmessageevenifblocked.unwrap_or(false);
                let can_message = member.canmessage.unwrap_or(false);
                let requires_contact = member.requirescontact.unwrap_or(false);
                let can_create_contact = member.cancreatecontact.unwrap_or(false);

                println!("{}. {} (ID: {})", i + 1, fullname, member_id);
                println!("   Profile URL: {}", profile_url);
                if !profile_image.is_empty() {
                    println!("   Profile Image: {}", profile_image);
                }
                println!(
                    "   Status: {}",
                    if is_online {
                        "🟢 Online"
                    } else {
                        "⚫ Offline"
                    }
                );
                println!(
                    "   Show Online Status: {}",
                    if show_online_status {
                        "✅ Yes"
                    } else {
                        "❌ No"
                    }
                );
                println!(
                    "   Contact: {}",
                    if is_contact { "✅ Yes" } else { "❌ No" }
                );
                println!(
                    "   Blocked: {}",
                    if is_blocked { "🚫 Yes" } else { "✅ No" }
                );
                println!(
                    "   Deleted: {}",
                    if is_deleted { "🗑️ Yes" } else { "✅ No" }
                );
                println!(
                    "   Can Message: {}",
                    if can_message { "✅ Yes" } else { "❌ No" }
                );
                println!(
                    "   Can Message Even If Blocked: {}",
                    if can_message_even_if_blocked {
                        "✅ Yes"
                    } else {
                        "❌ No"
                    }
                );
                println!(
                    "   Requires Contact: {}",
                    if requires_contact {
                        "⚠️ Yes"
                    } else {
                        "✅ No"
                    }
                );
                println!(
                    "   Can Create Contact: {}",
                    if can_create_contact {
                        "✅ Yes"
                    } else {
                        "❌ No"
                    }
                );

                // Show contact requests if available
                if let Some(requests) = &member.contactrequests {
                    if !requests.is_empty() {
                        println!("   Contact Requests: {} pending", requests.len());
                        for (j, request) in requests.iter().enumerate().take(3) {
                            let req_id = request.id.unwrap_or(0);
                            let req_user_id = request.userid.unwrap_or(0);
                            let req_requested_user_id = request.requesteduserid.unwrap_or(0);
                            let time_created = request.timecreated.unwrap_or(0);
                            println!(
                                "     {}. Request ID: {}, From: {}, To: {}, Time: {}",
                                j + 1,
                                req_id,
                                req_user_id,
                                req_requested_user_id,
                                time_created
                            );
                        }
                    }
                }

                // Show conversations if available
                if let Some(conversations) = &member.conversations {
                    if !conversations.is_empty() {
                        println!("   Conversations: {} active", conversations.len());
                        for (j, conv) in conversations.iter().enumerate().take(3) {
                            let conv_id = conv.id.unwrap_or(0);
                            let conv_name = conv.name.as_deref().unwrap_or("Unnamed");
                            let conv_type = conv.r#type.unwrap_or(0);
                            let conv_time = conv.timecreated.unwrap_or(0);
                            let type_str = match conv_type {
                                1 => "Individual",
                                2 => "Group",
                                3 => "Self",
                                _ => "Unknown",
                            };
                            println!(
                                "     {}. {} (ID: {}, {}, Time: {})",
                                j + 1,
                                conv_name,
                                conv_id,
                                type_str,
                                conv_time
                            );
                        }
                    }
                }

                println!();
            }
        }
        Err(e) => {
            println!("❌ Error fetching member information: {}", e);
        }
    }
}
