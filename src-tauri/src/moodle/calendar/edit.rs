use super::login;
use anyhow::Result;

pub async fn update_event_start_day(
    event_id: i64,
    year: i32,
    month: i32,
    day: i32,
) -> Result<serde_json::Value> {
    let client = login().await?;

    let mut form: Vec<(String, String)> = Vec::new();
    form.push(("eventid".to_string(), event_id.to_string()));
    form.push(("year".to_string(), year.to_string()));
    form.push(("month".to_string(), month.to_string()));
    form.push(("day".to_string(), day.to_string()));

    let json = client
        .post("core_calendar_update_event_start_day", &form)
        .await?;
    Ok(json)
}

pub async fn update_event(
    event_id: i64,
    name: Option<String>,
    description: Option<String>,
    timestart: Option<i64>,
    timeduration: Option<i64>,
    visible: Option<i64>,
) -> Result<serde_json::Value> {
    let client = login().await?;

    let mut form: Vec<(String, String)> = Vec::new();
    form.push(("events[0][eventid]".to_string(), event_id.to_string()));

    if let Some(n) = name {
        form.push(("events[0][name]".to_string(), n));
    }

    if let Some(desc) = description {
        form.push(("events[0][description]".to_string(), desc));
    }

    if let Some(ts) = timestart {
        form.push(("events[0][timestart]".to_string(), ts.to_string()));
    }

    if let Some(duration) = timeduration {
        form.push(("events[0][timeduration]".to_string(), duration.to_string()));
    }

    if let Some(vis) = visible {
        form.push(("events[0][visible]".to_string(), vis.to_string()));
    }

    let json = client
        .post("core_calendar_update_calendar_events", &form)
        .await?;
    Ok(json)
}
