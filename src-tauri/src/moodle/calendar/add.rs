use super::login;
use anyhow::Result;
use moodle_api::core::calendar::create_calendar_events::{self, ParamsEventsItem};

pub async fn add_event(
    name: String,
    description: Option<String>,
    eventtype: String,
    timestart: i64,
    timeduration: Option<i64>,
    courseid: Option<i64>,
    groupid: Option<i64>,
    visible: Option<i64>,
    sequence: Option<i64>,
) -> Result<serde_json::Value> {
    let mut client = login().await?;

    let event = ParamsEventsItem {
        r#name: Some(name),
        r#description: description,
        r#format: None,
        r#courseid: courseid,
        r#groupid: groupid,
        r#repeats: None,
        r#eventtype: Some(eventtype),
        r#timestart: Some(timestart),
        r#timeduration: timeduration,
        r#visible: Some(visible.unwrap_or(1)),
        r#sequence: Some(sequence.unwrap_or(1)),
    };

    let json = create_calendar_events::call_form(&mut client, &[event]).await?;
    Ok(json)
}
