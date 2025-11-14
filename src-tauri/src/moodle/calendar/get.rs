use super::login;
use anyhow::Result;

pub async fn get_events(timestart: Option<i64>, timeend: Option<i64>) -> Result<serde_json::Value> {
    let client = login().await?;

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

    let json = client
        .post("core_calendar_get_calendar_events", &form)
        .await?;
    Ok(json)
}

pub async fn get_monthly_view(year: i32, month: i32) -> Result<serde_json::Value> {
    let client = login().await?;

    let mut form: Vec<(String, String)> = Vec::new();
    form.push(("year".to_string(), year.to_string()));
    form.push(("month".to_string(), month.to_string()));

    let json = client
        .post("core_calendar_get_calendar_monthly_view", &form)
        .await?;
    Ok(json)
}

pub async fn get_day_view(year: i32, month: i32, day: i32) -> Result<serde_json::Value> {
    let client = login().await?;

    let mut form: Vec<(String, String)> = Vec::new();
    form.push(("year".to_string(), year.to_string()));
    form.push(("month".to_string(), month.to_string()));
    form.push(("day".to_string(), day.to_string()));

    let json = client
        .post("core_calendar_get_calendar_day_view", &form)
        .await?;
    Ok(json)
}

pub async fn get_upcoming_view() -> Result<serde_json::Value> {
    let client = login().await?;

    let form: Vec<(String, String)> = Vec::new();
    let json = client
        .post("core_calendar_get_calendar_upcoming_view", &form)
        .await?;
    Ok(json)
}
