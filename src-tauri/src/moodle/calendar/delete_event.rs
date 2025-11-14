use moodle_client::MoodleClient;

pub async fn run(client: &mut MoodleClient, eventid: i64, repeat_all: bool) {
    // Determine target event id. If not provided (>0), fetch first from list
    let target_id = if eventid > 0 {
        eventid
    } else {
        let mut form: Vec<(String, String)> = Vec::new();
        form.push(("options[userevents]".to_string(), "1".to_string()));
        form.push(("options[siteevents]".to_string(), "1".to_string()));
        form.push(("options[ignorehidden]".to_string(), "0".to_string()));
        match client
            .post("core_calendar_get_calendar_events", &form)
            .await
        {
            Ok(json) => {
                if let Some(events) = json.get("events").and_then(|v| v.as_array()) {
                    if let Some(first) = events.first() {
                        first.get("id").and_then(|v| v.as_i64()).unwrap_or(0)
                    } else {
                        0
                    }
                } else {
                    0
                }
            }
            Err(e) => {
                println!("❌ Error fetching events: {}", e);
                0
            }
        }
    };

    if target_id <= 0 {
        println!("No events found to delete.");
        return;
    }

    // Use flat form fields to match Moodle REST expectations
    let mut form: Vec<(String, String)> = Vec::new();
    form.push(("events[0][eventid]".to_string(), target_id.to_string()));
    form.push((
        "events[0][repeat]".to_string(),
        if repeat_all {
            "1".to_string()
        } else {
            "0".to_string()
        },
    ));

    match client
        .post("core_calendar_delete_calendar_events", &form)
        .await
    {
        Ok(json) => println!("{}", json),
        Err(e) => println!("❌ Error: {}", e),
    }
}
