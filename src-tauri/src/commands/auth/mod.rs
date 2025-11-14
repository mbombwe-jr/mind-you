#[tauri::command]
pub async fn moodle_login(base_url: String, username: String, password: String) -> Result<serde_json::Value, String> {
    let _ = dotenvy::dotenv();
    
    // Try to login with provided credentials
    match moodle_client::login(&base_url, &username, &password).await {
        Ok(token) => {
            // Store credentials and token in environment for future use
            std::env::set_var("MOODLE_URL", &base_url);
            std::env::set_var("MOODLE_USERNAME", &username);
            std::env::set_var("MOODLE_PASSWORD", &password);
            std::env::set_var("MOODLE_TOKEN", &token);
            println!("Moodle token: {}", &token);
            Ok(serde_json::json!({
                "success": true,
                "token": token,
                "message": "Login successful"
            }))
        }
        Err(e) => {
            Ok(serde_json::json!({
                "success": false,
                "error": e.to_string(),
                "message": "Login failed"
            }))
        }
    }
}
