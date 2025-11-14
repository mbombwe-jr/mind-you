use moodle_client::MoodleClient;

pub async fn run(
    client: &mut MoodleClient,
    view: &str,
    year: Option<i64>,
    month: Option<i64>,
    day: Option<i64>,
) {
    match view {
        "day" => {
            let mut params = moodle_api::core::calendar::get_calendar_day_view::Params {
                r#year: year,
                r#month: month,
                r#day: day,
                r#courseid: None,
                r#categoryid: None,
            };
            match moodle_api::core::calendar::get_calendar_day_view::call(client, &mut params).await
            {
                Ok(res) => println!("{:?}", res),
                Err(e) => println!("❌ Error: {}", e),
            }
        }
        "upcoming" => {
            let mut params = moodle_api::core::calendar::get_calendar_upcoming_view::Params {
                r#courseid: None,
                r#categoryid: None,
            };
            match moodle_api::core::calendar::get_calendar_upcoming_view::call(client, &mut params)
                .await
            {
                Ok(res) => println!("{:?}", res),
                Err(e) => println!("❌ Error: {}", e),
            }
        }
        _ => {
            eprintln!("unknown view: {}", view);
        }
    }
}
