use tauri::{plugin::Plugin, Invoke, Manager, Runtime, Window};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

pub mod scraper;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriveFile {
    pub name: String,
    pub data_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FolderContents {
    pub folder_url: String,
    pub files: Vec<DriveFile>,
}

/// List all files in a Google Drive folder
#[tauri::command]
async fn get_folder(folder_id: String) -> Result<FolderContents, String> {
    let folder_url = format!("https://drive.google.com/drive/folders/{}", folder_id);
    
    // Run the scraper in a blocking task since it uses reqwest::blocking
    let files = tokio::task::spawn_blocking(move || {
        scraper::scrape_folders(&folder_id)
    })
    .await
    .map_err(|e| format!("Task error: {}", e))?
    .map_err(|e| format!("Scraper error: {}", e))?;
    
    let drive_files: Vec<DriveFile> = files
        .into_iter()
        .map(|(name, data_id)| DriveFile { name, data_id })
        .collect();
    
    Ok(FolderContents {
        folder_url,
        files: drive_files,
    })
}

/// Get a specific file by its data_id from a folder
#[tauri::command]
async fn get_file_by_id(
    folder_id: String,
    target_data_id: String,
) -> Result<Option<DriveFile>, String> {
    // Run the scraper in a blocking task
    let result = tokio::task::spawn_blocking(move || {
        scraper::scrape_name_by_data_id(&folder_id, &target_data_id)
    })
    .await
    .map_err(|e| format!("Task error: {}", e))?
    .map_err(|e| format!("Scraper error: {}", e))?;
    
    Ok(result.map(|(name, data_id)| DriveFile { name, data_id }))
}

pub struct TauriGDrive<R: Runtime> {
    invoke_handler: Box<dyn Fn(Invoke<R>) + Send + Sync>,
}

impl<R: Runtime> TauriGDrive<R> {
    pub fn new() -> Self {
        Self {
            invoke_handler: Box::new(tauri::generate_handler![get_folder, get_file_by_id]),
        }
    }
}

impl<R: Runtime> Plugin<R> for TauriGDrive<R> {
    fn name(&self) -> &'static str {
        "gdrive"
    }

    fn extend_api(&mut self, invoke: Invoke<R>) {
        (self.invoke_handler)(invoke)
    }

    fn created(&mut self, _window: Window<R>) {
        println!("Google Drive plugin initialized");
    }
}

impl<R: Runtime> Default for TauriGDrive<R> {
    fn default() -> Self {
        Self::new()
    }
}