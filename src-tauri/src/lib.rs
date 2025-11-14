// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use anyhow::Result;

// Import the existing Moodle modules
mod commands;
pub mod moodle;
mod news;
mod taxi_service;
use moodle_client::MoodleClient;
use news::{scrape_article_content, scrape_udsm_news};
pub mod libp2p_plugin;


// Import Tauri commands from commands modules
use commands::auth::moodle_login;
use commands::bolt::{confirm_verification, get_location_suggestions, start_verification};
use commands::moodle::{
    confirm_contact_request, create_contact_request, decline_contact_request, get_assignment_count, get_enrolled_course_count, get_contact_requests, get_conversation_messages, get_conversations,
    get_site_info, get_user_contacts, search_contacts, send_message, send_instant_message,
};
use commands::network::{get_network_info, send_channel_message, get_channel_messages};
use commands::moodle::course::{get_course_files_assignments_quizzes, get_course_content_items, get_enrolled_users_for_course, get_user_courses, get_all_courses};

// Tauri commands wrappers
#[tauri::command]
async fn get_taxi_vehicles() -> Result<Vec<taxi_service::TaxiVehicle>, String> {
    taxi_service::taxi_vehicles::fetch_and_build_taxi_vehicles()
        .await
        .map_err(|e| e.to_string())
}
pub async fn login() -> Result<MoodleClient> {
    let _ = dotenvy::dotenv();
    let base_url =
        std::env::var("MOODLE_URL").unwrap_or_else(|_| "https://school.moodledemo.net".to_string());
    let username = std::env::var("MOODLE_USERNAME").unwrap_or_else(|_| "student".to_string());
    let password = std::env::var("MOODLE_PASSWORD").unwrap_or_else(|_| "moodle25".to_string());

    let token = moodle_client::login(&base_url, &username, &password).await?;
    Ok(MoodleClient::new(&base_url, &token))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!("app_lib::run -> start");
    // Initialize logger for production
    #[cfg(not(debug_assertions))]
    {
        std::env::set_var("RUST_LOG", "debug");
    }
    
    #[cfg(debug_assertions)]
    env_logger::init();

    println!("app_lib::run -> before Builder::default");
    tauri::Builder::default()
        // .plugin(tauri_plugin_updater::Builder::new().build())
        // .plugin(tauri_plugin_opener::init())
        // .plugin(tauri_plugin_store::Builder::new().build())
        // .plugin(tauri_plugin_dialog::init())
        // .plugin(tauri_plugin_os::init())
        // // Temporarily disable window_state - might cause stack overflow
        // // .plugin(tauri_plugin_window_state::Builder::default().build())
        // .plugin(tauri_plugin_websocket::init())
        // .plugin(tauri_plugin_stronghold::Builder::new(|_| vec![]).build())
        // //.plugin(libp2p_plugin::init())
        // //.plugin(tauri_plugin_system_info::init())
        // .plugin(tauri_plugin_notification::init())

        .setup(|_app| {
            println!("tauri setup callback");
            
            // Kick off an initial Moodle login on startup (non-blocking)
            // Add delay to prevent blocking during startup
             tauri::async_runtime::spawn(async move {
                 // Wait a bit before attempting login to avoid startup issues
                 tokio::time::sleep(tokio::time::Duration::from_millis(4000)).await;
                 if let Err(e) = login().await {
                     eprintln!("Initial Moodle login failed: {}", e);
                 }

                 if let Err(e) = get_assignment_count().await {
                    eprintln!("Initial get_assignment_count failed: {}", e);
                }
                
                if let Err(e) = get_enrolled_course_count().await {
                    eprintln!("Initial get_enrolled_course_count failed: {}", e);
                }
             });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            //MOODLE
            get_site_info,
            //MOODLE DASHBOARD
            get_assignment_count,
            get_enrolled_course_count,
            //MOODLE MESSAGES
            get_conversations,
            get_conversation_messages,
            send_message,
            send_instant_message,
            //MOODLE CONTACTS
            get_contact_requests,
            get_user_contacts,
            search_contacts,
            create_contact_request,
            confirm_contact_request,
            decline_contact_request,
            //BOLT
            get_taxi_vehicles,
            start_verification,
            confirm_verification,
            get_location_suggestions,
            //AUTH
            moodle_login,
            //LOGIN NEWS
            scrape_udsm_news,
            scrape_article_content,
            //NETWORK
            get_network_info,
            send_channel_message,
            get_channel_messages,
            //COURSE
            get_course_files_assignments_quizzes,
            get_course_content_items,
            get_enrolled_users_for_course,
            get_user_courses,
            get_all_courses,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    println!("app_lib::run -> end");
}