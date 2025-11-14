use moodle_api::core::webservice::get_site_info;
use moodle_api::enrol::self_::enrol_user;
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
    let _user_id = match user_id {
        Some(id) => id,
        None => {
            println!("Could not extract user id from site info.");
            return;
        }
    };
    println!("=== ENROLL IN A COURSE (SELF-ENROLLMENT) ===");
    print!("Enter the course ID: ");
    io::stdout().flush().unwrap();
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let courseid = match input.trim().parse::<i64>() {
        Ok(id) => id,
        Err(_) => {
            println!("Invalid course ID.");
            return;
        }
    };
    print!("Enter enrollment key (default: internet): ");
    io::stdout().flush().unwrap();
    input.clear();
    io::stdin().read_line(&mut input).unwrap();
    let password = input.trim();
    let password = if password.is_empty() {
        "internet"
    } else {
        password
    };
    println!(
        "Enrolling in course ID {} with key '{}'...",
        courseid, password
    );
    let result = enrol_user::call(
        client,
        &mut enrol_user::Params {
            courseid: Some(courseid),
            password: Some(password.to_string()),
            instanceid: None,
        },
    )
    .await;
    match result {
        Ok(response) => {
            if response.status == Some(true) {
                println!("✅ Successfully enrolled!");
            } else {
                println!("❌ Enrollment failed. Check the key and try again.");
            }
            if let Some(warnings) = response.warnings {
                for w in warnings {
                    println!("Warning: {}", w.message.unwrap_or_default());
                }
            }
        }
        Err(e) => {
            println!("❌ Error enrolling: {}", e);
        }
    }
}
