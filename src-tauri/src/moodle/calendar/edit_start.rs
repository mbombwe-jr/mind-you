use moodle_client::MoodleClient;

pub async fn run(client: &mut MoodleClient, eventid: i64, new_ts: i64) {
    let mut params = moodle_api::core::calendar::update_event_start_day::Params {
        r#eventid: Some(eventid),
        r#daytimestamp: Some(new_ts),
    };

    match moodle_api::core::calendar::update_event_start_day::call(client, &mut params).await {
        Ok(res) => println!("{:?}", res),
        Err(e) => println!("❌ Error: {}", e),
    }
}
