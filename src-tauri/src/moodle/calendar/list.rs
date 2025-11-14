use moodle_client::MoodleClient;

pub async fn run(client: &mut MoodleClient, timestart: Option<i64>, timeend: Option<i64>) {
    let mut form: Vec<(String, String)> = Vec::new();
    form.push(("options[userevents]".to_string(), "1".to_string()));
    form.push(("options[siteevents]".to_string(), "1".to_string()));
    form.push(("options[ignorehidden]".to_string(), "0".to_string()));
    if let Some(ts) = timestart {
        form.push(("options[timestart]".to_string(), ts.to_string()));
    }
    if let Some(te) = timeend {
        form.push(("options[timeend]".to_string(), te.to_string()));
    }

    match client
        .post("core_calendar_get_calendar_events", &form)
        .await
    {
        Ok(json) => println!("{}", json),
        Err(e) => println!("❌ Error: {}", e),
    }
}
