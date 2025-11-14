use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::webservice::get_site_info;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SiteInfo {
    pub userid: i64,
    pub username: String,
    pub firstname: String,
    pub lastname: String,
    pub fullname: String,
    pub lang: String,
    pub userpictureurl: Option<String>,
    pub siteurl: String,
    pub sitename: String,
    pub version: String,
}

pub async fn get_current_site_info() -> Result<SiteInfo> {
    let mut client = login().await?;

    let mut params = get_site_info::Params {
        serviceshortnames: None,
    };

    let response = get_site_info::call_raw(&mut client, &mut params).await?;

    // Parse the JSON response
    let site_info: SiteInfo = serde_json::from_value(response)?;

    Ok(site_info)
}
