pub mod add;
pub mod delete;
pub mod edit;
pub mod get;

use anyhow::Result;
use moodle_client::MoodleClient;

pub async fn login() -> Result<MoodleClient> {
    let _ = dotenvy::dotenv();
    let base_url =
        std::env::var("MOODLE_URL").unwrap_or_else(|_| "http://0.0.0.0/moodle".to_string());
    let username = std::env::var("MOODLE_USERNAME").unwrap_or_else(|_| "admin".to_string());
    let password = std::env::var("MOODLE_PASSWORD").unwrap_or_else(|_| "admin".to_string());

    let token = moodle_client::login(&base_url, &username, &password).await?;
    Ok(MoodleClient::new(&base_url, &token))
}
