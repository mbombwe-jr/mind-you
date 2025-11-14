use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::webservice::get_site_info;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SiteInfo {
    pub username: String,
    pub userid: i64,
}

pub async fn get_courses_site_info() -> Result<SiteInfo> {
    let mut client = login().await?;
    let mut params = get_site_info::Params {
        serviceshortnames: None,
    };
    let result = get_site_info::call(&mut client, &mut params).await?;
    Ok(SiteInfo {
        username: result.username.unwrap_or_default(),
        userid: result.userid.unwrap_or(0),
    })
}
