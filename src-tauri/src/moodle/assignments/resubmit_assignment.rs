use moodle_api::core::webservice::get_site_info;
use moodle_api::mod_::assign::start_submission;
use moodle_client::MoodleClient;
use std::io::{self, Write};
use std::fs;
use std::collections::HashMap;

pub async fn run(client: &mut MoodleClient) {
    // Get current user id
    let user_id = match get_site_info::call_raw(
        client,
        &mut get_site_info::Params { serviceshortnames: None },
    ).await {
        Ok(site_info) => site_info.get("userid").and_then(|v| v.as_i64()),
        Err(e) => {
            println!("Could not fetch current user id: {}", e);
            return;
        }
    };
    let user_id = match user_id {
        Some(id) => id,
        None => {
            println!("Could not extract user id from site info.");
            return;
        }
    };

    println!("=== RESUBMIT ASSIGNMENT ===");
    println!("Current User ID: {}", user_id);

    // Get assignment ID
    print!("Enter the assignment ID to resubmit: ");
    io::stdout().flush().unwrap();
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let assignment_id = match input.trim().parse::<i64>() {
        Ok(id) => id,
        Err(_) => {
            println!("Invalid assignment ID.");
            return;
        }
    };

    // Create a new simple.txt file in temp directory for resubmission
    let temp_dir = std::env::temp_dir();
    let file_path = temp_dir.join("simple_resubmit.txt");
    
    println!("Creating resubmission test file: {:?}", file_path);
    let file_content = "This is a RESUBMISSION test file created by the Moodle CLI tool.\n\nUpdated assignment submission content.\n\nResubmitted at: ".to_string() + &chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string() + "\n\nThis is version 2 of the submission with updated content.";
    
    match fs::write(&file_path, file_content) {
        Ok(_) => {
            println!("✅ Resubmission test file created successfully: {:?}", file_path);
        }
        Err(e) => {
            println!("❌ Error creating resubmission test file: {}", e);
            return;
        }
    }

    // Step 1: Start new submission (this will create a new submission or update existing)
    println!("\n📝 Starting assignment resubmission...");
    match start_submission::call(
        client,
        &mut start_submission::Params {
            assignid: Some(assignment_id),
        },
    ).await {
        Ok(response) => {
            if let Some(submission_id) = response.submissionid {
                println!("✅ Resubmission started! Submission ID: {}", submission_id);
                
                // Step 2: Try different resubmission approaches
                println!("\n💾 Attempting resubmission...");
                
                // Read the file content for inclusion in the submission
                let file_content = match fs::read_to_string(&file_path) {
                    Ok(content) => content,
                    Err(_) => "Could not read resubmission file".to_string(),
                };
                
                // Try Approach 1: Online text resubmission (for assignments that support it)
                println!("🔄 Trying online text resubmission...");
                let mut save_params = HashMap::new();
                save_params.insert("assignmentid".to_string(), assignment_id.to_string());
                save_params.insert("plugindata[onlinetext_editor][text]".to_string(), 
                    format!("RESUBMISSION - Assignment updated with new file: {:?}\n\nUpdated file content:\n{}\n\nThis is a resubmission with revised content.", file_path, file_content));
                save_params.insert("plugindata[onlinetext_editor][format]".to_string(), "1".to_string());
                save_params.insert("plugindata[onlinetext_editor][itemid]".to_string(), "0".to_string());
                
                match client.post("mod_assign_save_submission", &save_params).await {
                    Ok(response_json) => {
                        println!("Raw Save Resubmission Response: {}", serde_json::to_string_pretty(&response_json).unwrap());
                        
                        if let Some(warnings) = response_json.get("warnings").and_then(|v| v.as_array()) {
                            if warnings.is_empty() {
                                println!("✅ Assignment resubmission saved successfully!");
                                println!("📄 Resubmission file path: {:?}", file_path);
                                println!("📝 Resubmission includes updated file content in online text.");
                                println!("🔄 This submission replaces the previous submission.");
                            } else {
                                // Check if this is the "Nothing was submitted" warning
                                if warnings.iter().any(|w| 
                                    w.get("warningcode").and_then(|v| v.as_str()) == Some("couldnotsavesubmission")
                                ) {
                                    println!("⚠️ Online text resubmission failed - assignment may only accept file submissions.");
                                    
                                    // Try Approach 2: File resubmission (simulate file upload)
                                    println!("🔄 Trying file resubmission approach...");
                                    
                                    let mut file_params = HashMap::new();
                                    file_params.insert("assignmentid".to_string(), assignment_id.to_string());
                                    file_params.insert("plugindata[files_filemanager]".to_string(), "0".to_string());
                                    
                                    match client.post("mod_assign_save_submission", &file_params).await {
                                        Ok(file_response_json) => {
                                            println!("Raw File Resubmission Response: {}", serde_json::to_string_pretty(&file_response_json).unwrap());
                                            
                                            if let Some(file_warnings) = file_response_json.get("warnings").and_then(|v| v.as_array()) {
                                                if file_warnings.is_empty() {
                                                    println!("✅ File resubmission approach successful!");
                                                    println!("📄 Resubmission file path: {:?}", file_path);
                                                    println!("📝 Note: Actual file upload requires additional API calls.");
                                                    println!("🔄 This resubmission replaces the previous submission.");
                                                } else {
                                                    println!("❌ File resubmission also failed:");
                                                    for warning in file_warnings {
                                                        println!("   - {}: {}", 
                                                            warning.get("warningcode").and_then(|v| v.as_str()).unwrap_or("Unknown"),
                                                            warning.get("message").and_then(|v| v.as_str()).unwrap_or("No message")
                                                        );
                                                    }
                                                    
                                                    println!("\n💡 This assignment appears to require actual file uploads.");
                                                    println!("   The CLI tool cannot upload files directly.");
                                                    println!("   Please use the Moodle web interface to resubmit files.");
                                                }
                                            }
                                        }
                                        Err(e) => {
                                            println!("❌ Error with file resubmission approach: {}", e);
                                        }
                                    }
                                } else {
                                    println!("⚠️ Resubmission completed with warnings:");
                                    for warning in warnings {
                                        println!("   - {}: {}", 
                                            warning.get("warningcode").and_then(|v| v.as_str()).unwrap_or("Unknown"),
                                            warning.get("message").and_then(|v| v.as_str()).unwrap_or("No message")
                                        );
                                    }
                                }
                            }
                        } else {
                            println!("✅ Assignment resubmission saved successfully!");
                            println!("📄 Resubmission file path: {:?}", file_path);
                            println!("📝 Resubmission includes updated file content in online text.");
                            println!("🔄 This submission replaces the previous submission.");
                        }
                    }
                    Err(e) => {
                        println!("❌ Error saving resubmission: {}", e);
                    }
                }
            } else {
                println!("❌ Failed to start resubmission - no submission ID returned.");
                if let Some(warnings) = response.warnings {
                    for warning in warnings {
                        println!("   Warning: {} - {}", 
                            warning.warningcode.as_deref().unwrap_or("Unknown"),
                            warning.message.as_deref().unwrap_or("No message")
                        );
                    }
                }
            }
        }
        Err(e) => {
            println!("❌ Error starting resubmission: {}", e);
        }
    }

    // Clean up the temp file
    match fs::remove_file(&file_path) {
        Ok(_) => println!("\n🧹 Resubmission temporary file cleaned up: {:?}", file_path),
        Err(e) => println!("\n⚠️ Could not clean up resubmission temporary file: {}", e),
    }
}