use super::login;
use anyhow::Result;

pub async fn delete_event(event_id: i64, repeat: Option<bool>) -> Result<serde_json::Value> {
    let client = login().await?;

    let mut form: Vec<(String, String)> = Vec::new();
    form.push(("events[0][eventid]".to_string(), event_id.to_string()));

    if let Some(rep) = repeat {
        form.push(("events[0][repeat]".to_string(), rep.to_string()));
    } else {
        form.push(("events[0][repeat]".to_string(), "false".to_string()));
    }

    let json = client
        .post("core_calendar_delete_calendar_events", &form)
        .await?;
    Ok(json)
}
