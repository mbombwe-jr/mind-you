use chrono::Utc;
use moodle_api::core::calendar::create_calendar_events;
use moodle_client::MoodleClient;

pub async fn run(client: &mut MoodleClient) {
    // Build one event using the typed struct, then send via form (flat) encoding
    let event = create_calendar_events::ParamsEventsItem {
        r#name: Some("Test Event".to_string()),
        r#description: None,
        r#format: None,
        r#courseid: None,
        r#groupid: None,
        r#repeats: None,
        r#eventtype: Some("site".to_string()), //site, user, course, group
        r#timestart: Some(Utc::now().timestamp()),
        r#timeduration: None,
        r#visible: Some(1),
        r#sequence: Some(1),
    };

    let result = create_calendar_events::call_form(client, &[event]).await;

    match result {
        Ok(json) => {
            // Pretty-print full JSON so we can see exactly what Moodle returned
            println!(
                "{}",
                serde_json::to_string_pretty(&json).unwrap_or_else(|_| json.to_string())
            );

            // Optionally, extract events array if present
            if let Some(events) = json.get("events").and_then(|v| v.as_array()) {
                for ev in events {
                    let id = ev.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
                    let name = ev.get("name").and_then(|v| v.as_str()).unwrap_or("");
                    let ts = ev.get("timestart").and_then(|v| v.as_i64()).unwrap_or(0);
                    println!("Created event: id={}, name={}, timestart={}", id, name, ts);
                }
            }

            if let Some(warnings) = json.get("warnings").and_then(|v| v.as_array()) {
                if warnings.is_empty() {
                    println!("✅ Event has been successfully created!");
                } else {
                    println!("⚠️ Event created with warnings:");
                    for w in warnings {
                        let msg = w.get("message").and_then(|v| v.as_str()).unwrap_or("");
                        if !msg.is_empty() {
                            println!("  - {}", msg);
                        }
                    }
                }
            } else {
                println!("✅ Event has been successfully created!");
            }
        }
        Err(e) => {
            println!("❌ Error creating event: {}", e);
        }
    }
}
