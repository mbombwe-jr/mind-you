use moodle_client::MoodleClient;

pub async fn run(client: &mut MoodleClient, year: i64, month: i64, courseid: Option<i64>) {
    let mut params = moodle_api::core::calendar::get_calendar_monthly_view::Params {
        r#year: Some(year),
        r#month: Some(month),
        r#courseid: courseid,
        r#categoryid: None,
        r#includenavigation: Some(true),
        r#mini: Some(false),
        r#day: None,
        r#view: Some("month".to_string()),
    };

    match moodle_api::core::calendar::get_calendar_monthly_view::call(client, &mut params).await {
        Ok(res) => println!("{:?}", res),
        Err(e) => println!("❌ Error: {}", e),
    }
}
