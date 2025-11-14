use moodle_api::core::webservice::get_site_info;
use moodle_client::MoodleClient;
use std::collections::HashMap;
use std::io::{self, Write};

pub async fn run(client: &mut MoodleClient) {
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

    println!("=== DELETE CONTACTS ===");
    println!("Current User ID: {}", user_id);
    print!("Enter the User IDs to delete (comma separated): ");
    io::stdout().flush().unwrap();
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let userids: Vec<i64> = input
        .trim()
        .split(',')
        .filter_map(|s| s.trim().parse::<i64>().ok())
        .collect();

    if userids.is_empty() {
        println!("No valid user IDs provided.");
        return;
    }

    // Flatten userids for Moodle form
    let mut form_params = HashMap::new();
    for (i, uid) in userids.iter().enumerate() {
        form_params.insert(format!("userids[{}]", i), uid.to_string());
    }
    form_params.insert("userid".to_string(), user_id.to_string());

    // Use the client directly for the POST
    let result = client
        .post("core_message_delete_contacts", &form_params)
        .await;

    match result {
        Ok(json) => println!("Delete contacts result: {:#?}", json),
        Err(e) => println!("Error deleting contacts: {}", e),
    }
}
