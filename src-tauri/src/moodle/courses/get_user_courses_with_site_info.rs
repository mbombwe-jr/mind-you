use super::super::calendar::login;
use anyhow::Result;
use moodle_api::core::course::get_enrolled_courses_by_timeline_classification;
use moodle_api::core::webservice::get_site_info;
use serde_json::json;

pub async fn get_user_courses_with_site_info() -> Result<serde_json::Value> {
    let mut client = login().await?;
    // Get site info
    let mut site_info_params = get_site_info::Params {
        serviceshortnames: None,
    };
    let site_info = get_site_info::call_raw(&mut client, &mut site_info_params).await?;

    // Get enrolled courses
    let mut courses_params = get_enrolled_courses_by_timeline_classification::Params {
        classification: Some("all".to_string()),
        limit: None,
        offset: None,
        sort: None,
        customfieldname: None,
        customfieldvalue: None,
        searchvalue: None,
    };
    let courses_result =
        get_enrolled_courses_by_timeline_classification::call_raw(&mut client, &mut courses_params)
            .await?;

    let response = json!({
        "siteInfo": site_info,
        "courses": courses_result
    });

    Ok(response)
}
