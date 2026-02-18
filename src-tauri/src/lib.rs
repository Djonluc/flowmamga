use tauri::{command, Emitter, AppHandle, Manager};
use walkdir::WalkDir;
use serde::Serialize;
use uuid::Uuid;
use std::fs;
use std::io;
use std::path::Path;

#[derive(Serialize)]
pub struct VideoMetadata {
    id: String,
    file_path: String,
    title: String,
}

#[command]
async fn scan_video_folder(path: String) -> Result<Vec<VideoMetadata>, String> {
    let mut videos = Vec::new();
    let supported_extensions = ["mp4", "mkv", "webm", "avi"];

    for entry in WalkDir::new(&path).max_depth(1).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            if let Some(ext) = entry.path().extension().and_then(|s| s.to_str()) {
                if supported_extensions.contains(&ext.to_lowercase().as_str()) {
                    let file_path = entry.path().to_string_lossy().into_owned();
                    let title = entry.path().file_stem()
                        .and_then(|s| s.to_str())
                        .unwrap_or("Unknown")
                        .to_string();
                    
                    videos.push(VideoMetadata {
                        id: Uuid::new_v4().to_string(),
                        file_path,
                        title,
                    });
                }
            }
        }
    }
    
    Ok(videos)
}

#[derive(Serialize, serde::Deserialize, Clone)]
pub struct MangaMetadata {
    id: String,
    file_path: String,
    title: String,
    cover_path: Option<String>,
    author: Option<String>,
    description: Option<String>,
    tags: Option<Vec<String>>,
    // New fields for Standard
    total_chapters: Option<i32>,
    version: Option<i32>,
}

fn sanitize_filename(name: &str) -> String {
    name.replace(&['/', '\\', '?', '%', '*', ':', '|', '"', '<', '>'][..], "_")
}

// Helper: Auto-migrate messy folders to Standard Structure
fn migrate_to_standard(path: &Path) -> io::Result<()> {
    let chapters_dir = path.join("chapters");
    if !chapters_dir.exists() {
        fs::create_dir(&chapters_dir)?;
    }

    let img_extensions = ["jpg", "jpeg", "png", "webp"];
    let mut moved_images = false;
    let mut moved_folders = false;

    // 1. Check for loose images in root (Single Chapter mode -> chapters/001)
    let mut root_images = Vec::new();
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let entry_path = entry.path();
        
        if entry_path.is_file() {
            if let Some(name) = entry_path.file_name().and_then(|s| s.to_str()) {
                // Ignore cover.jpg and metadata.json
                if name.eq_ignore_ascii_case("cover.jpg") || name.eq_ignore_ascii_case("metadata.json") {
                    continue;
                }
                
                if let Some(ext) = entry_path.extension().and_then(|s| s.to_str()) {
                    if img_extensions.contains(&ext.to_lowercase().as_str()) {
                        root_images.push(entry_path);
                    }
                }
            }
        }
    }

    if !root_images.is_empty() {
        let ch001 = chapters_dir.join("001");
        if !ch001.exists() { fs::create_dir(&ch001)?; }
        
        for img_path in root_images {
            if let Some(name) = img_path.file_name() {
                let dest = ch001.join(name);
                fs::rename(img_path, dest)?;
                moved_images = true;
            }
        }
    }

    // 2. Check for "Chapter X" folders in root (Messy -> chapters/00X)
    let mut subfolders = Vec::new();
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let entry_path = entry.path();
        if entry_path.is_dir() && entry_path.file_name() != Some(std::ffi::OsStr::new("chapters")) {
            subfolders.push(entry_path);
        }
    }

    // Sort subfolders to try and map them to 001, 002... if they contain numbers
    subfolders.sort_by_key(|p| p.to_string_lossy().to_string());

    let mut chapter_counter = 1;
    for folder in subfolders {
        // Simple heuristic: does it contain images?
        let mut has_images = false;
        if let Ok(entries) = fs::read_dir(&folder) {
            for sub in entries.flatten() {
                 if let Some(ext) = sub.path().extension().and_then(|s| s.to_str()) {
                    if img_extensions.contains(&ext.to_lowercase().as_str()) {
                        has_images = true;
                        break;
                    }
                }
            }
        }

        if has_images {
            // Try to extract number from folder name, else increment
            let folder_name = folder.file_name().unwrap().to_string_lossy().to_string();
            let num: i32 = folder_name.chars()
                .filter(|c| c.is_numeric())
                .collect::<String>()
                .parse()
                .unwrap_or(chapter_counter);
            
            // If parse failed/was 0, use counter
            let final_num = if num == 0 { chapter_counter } else { num };
            
            let dest_name = format!("{:03}", final_num);
            let dest_path = chapters_dir.join(&dest_name);
            
            // If collision (e.g. multiple "Chapter 1"), fallback to increment
            let final_dest = if dest_path.exists() {
                 chapters_dir.join(format!("{:03}", chapter_counter))
            } else {
                dest_path
            };

            // Move the folder content or rename the folder?
            // Rename is faster/easier
            if let Err(e) = fs::rename(&folder, &final_dest) {
                // If rename fails (e.g. cross-device), might need recursive move. 
                // For now assuming same filesystem.
                println!("Failed to move {:?} to {:?}: {}", folder, final_dest, e);
            } else {
                moved_folders = true;
            }
            chapter_counter += 1;
        }
    }

    // 3. Generate Metadata if missing
    let meta_path = path.join("metadata.json");
    if !meta_path.exists() && (moved_images || moved_folders) {
         let title = path.file_name().unwrap_or_default().to_string_lossy().to_string();
         let start_meta = serde_json::json!({
             "title": title,
             "displayTitle": title,
             "description": "Auto-migrated by FlowManga",
             "author": "",
             "tags": ["migrated"],
             "totalChapters": 0, // Should calculate?
             "source": "local",
             "version": 2
         });
         let f = fs::File::create(meta_path)?;
         serde_json::to_writer_pretty(f, &start_meta)?;
    }

    Ok(())
}

#[command]
async fn scan_manga_folder(path: String) -> Result<Vec<MangaMetadata>, String> {
    let mut manga = Vec::new();
    let root_path = Path::new(&path);
    
    // Auto-migrate the ROOT if it looks like a manga itself? 
    // Usually 'path' is the Library root. We scan subfolders.
    
    let process_folder = |folder_path: &Path| -> Option<MangaMetadata> {
        let meta_path = folder_path.join("metadata.json");
        let chapters_dir = folder_path.join("chapters");
        
        let mut meta_json: Option<serde_json::Value> = None;
        let mut needs_migration = false;

        // Check for loose structure that needs migration
        if !chapters_dir.exists() {
             // Check if it has images (Single) or subfolders (Messy)
             let mut has_content = false;
             let img_extensions = ["jpg", "jpeg", "png", "webp"];
             if let Ok(entries) = fs::read_dir(folder_path) {
                 for e in entries.flatten() {
                     let p = e.path();
                     if p.is_file() {
                         if let Some(ext) = p.extension().and_then(|s| s.to_str()) {
                             if img_extensions.contains(&ext.to_lowercase().as_str()) {
                                 // Don't count cover.jpg as content requiring migration if it's the *only* thing
                                 if !p.file_name().unwrap().to_string_lossy().eq_ignore_ascii_case("cover.jpg") {
                                      has_content = true; 
                                 }
                             }
                         }
                     } else if p.is_dir() {
                         // Shallow check for images in subfolder
                          if let Ok(sub) = fs::read_dir(&p) {
                              for s in sub.flatten() {
                                   if let Some(ext) = s.path().extension().and_then(|str| str.to_str()) {
                                       if img_extensions.contains(&ext.to_lowercase().as_str()) {
                                           has_content = true;
                                           break;
                                       }
                                   }
                              }
                          }
                     }
                 }
             }
             if has_content {
                 needs_migration = true;
             }
        }

        if needs_migration {
            println!("Migrating: {:?}", folder_path);
            let _ = migrate_to_standard(folder_path);
        }

        // Re-check existence after migration
        if folder_path.join("chapters").exists() || meta_path.exists() {
             // It's a manga!
             
             if let Ok(content) = std::fs::read_to_string(&meta_path) {
                meta_json = serde_json::from_str(&content).ok();
             }

             let folder_name = folder_path.file_name().unwrap_or_default().to_string_lossy().to_string();
             
             let title = meta_json.as_ref()
                .and_then(|j| j["title"].as_str().or(j["displayTitle"].as_str()))
                .map(|s| s.to_string())
                .unwrap_or_else(|| folder_name.clone());

             let author = meta_json.as_ref().and_then(|j| j["author"].as_str()).map(|s| s.to_string());
             let description = meta_json.as_ref().and_then(|j| j["description"].as_str()).map(|s| s.to_string());
             let tags = meta_json.as_ref().and_then(|j| j["tags"].as_array())
                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect());
             let total_chapters = meta_json.as_ref().and_then(|j| j["totalChapters"].as_i64()).map(|i| i as i32);
             let version = meta_json.as_ref().and_then(|j| j["version"].as_i64()).map(|i| i as i32);

             let mut cover_path = None;
             // 1. explicit coverFile in metadata
             if let Some(cf) = meta_json.as_ref().and_then(|j| j["coverFile"].as_str()) {
                 let p = folder_path.join(cf);
                 if p.exists() { cover_path = Some(p.to_string_lossy().into_owned()); }
             }
             // 2. cover.jpg at root
             if cover_path.is_none() {
                 let p = folder_path.join("cover.jpg");
                 if p.exists() { cover_path = Some(p.to_string_lossy().into_owned()); }
             }

             return Some(MangaMetadata {
                 id: Uuid::new_v4().to_string(),
                 file_path: folder_path.to_string_lossy().into_owned(),
                 title,
                 cover_path,
                 author,
                 description,
                 tags,
                 total_chapters,
                 version
             });
        }
        None
    };

    // 1. Check Root (if it is a manga itself)
    if let Some(m) = process_folder(root_path) {
        manga.push(m);
    }

    // 2. Check Subdirectories (Library Mode)
    for entry in WalkDir::new(root_path).max_depth(1).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_dir() && entry.path() != root_path {
            if let Some(m) = process_folder(entry.path()) {
                manga.push(m);
            }
        }
    }
    
    manga.sort_by(|a, b| a.file_path.cmp(&b.file_path));
    manga.dedup_by(|a, b| a.file_path == b.file_path);
    
    Ok(manga)
}

#[derive(Serialize)]
pub struct ChapterMetadata {
    id: String,
    title: String,
    chapter_number: f32,
    file_path: String,
}

#[command]
async fn scan_chapters(path: String, series_id: String) -> Result<Vec<ChapterMetadata>, String> {
    let mut chapters = Vec::new();
    let root = Path::new(&path);
    let chapters_dir = root.join("chapters");
    let img_extensions = ["jpg", "jpeg", "png", "webp"];

    if chapters_dir.exists() {
        // Standard Mode: Scan only /chapters/
        let entries = std::fs::read_dir(&chapters_dir).map_err(|e| e.to_string())?;
        
        for entry in entries.filter_map(|e| e.ok()) {
            if entry.path().is_dir() {
                // Check if it has images
                let mut has_images = false;
                for sub in fs::read_dir(entry.path()).map_err(|e| e.to_string())?.filter_map(|e| e.ok()) {
                     if let Some(ext) = sub.path().extension().and_then(|s| s.to_str()) {
                        if img_extensions.contains(&ext.to_lowercase().as_str()) {
                            has_images = true;
                            break;
                        }
                    }
                }
                
                if has_images {
                    let folder_name = entry.file_name().to_string_lossy().to_string();
                    // Try to parse number for sorting
                    let num: f32 = folder_name.parse().unwrap_or(0.0);
                    
                    // Format title nicely (e.g. "Chapter 1" instead of "Chapter 001")
                    let display_title = if num > 0.0 { 
                        format!("Chapter {}", num) 
                    } else { 
                        format!("Chapter {}", folder_name) 
                    };

                    chapters.push(ChapterMetadata {
                        id: format!("{}-{}", series_id, folder_name),
                        title: display_title,
                        chapter_number: num,
                        file_path: entry.path().to_string_lossy().into_owned(),
                    });
                }
            }
        }
    } else {
        // Fallback or Empty?
        // If we migrated properly, chapters_dir SHOULD exist.
        // But if something failed, return empty.
        // OR legacy archive handling support?
        // For now, STRICT STANDARD says /chapters/ only.
    }

    // Sort numerically
    chapters.sort_by(|a, b| a.chapter_number.partial_cmp(&b.chapter_number).unwrap_or(std::cmp::Ordering::Equal));
    
    Ok(chapters)
}

#[command]
async fn read_folder(app: AppHandle, path: String) -> Result<Vec<String>, String> {
    let mut files = Vec::new();
    let supported_extensions = ["jpg", "jpeg", "png", "webp", "gif"];
    let archive_extensions = ["zip", "cbz"];

    let input_path = Path::new(&path);
    
    if input_path.is_file() {
        let ext = input_path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
        if archive_extensions.contains(&ext.as_str()) {
            let cache_dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
            let extract_id = Uuid::new_v4().to_string();
            let extract_path = cache_dir.join("reader_cache").join(extract_id);
            
            fs::create_dir_all(&extract_path).map_err(|e| e.to_string())?;
            
            let file = fs::File::open(input_path).map_err(|e| e.to_string())?;
            let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
            
            for i in 0..archive.len() {
                let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
                let outpath = match file.enclosed_name() {
                    Some(path) => extract_path.join(path.to_owned()),
                    None => continue,
                };

                if (*file.name()).ends_with('/') {
                    fs::create_dir_all(&outpath).ok();
                } else {
                    if let Some(p) = outpath.parent() {
                        if !p.exists() { fs::create_dir_all(&p).ok(); }
                    }
                    let mut outfile = fs::File::create(&outpath).map_err(|e| e.to_string())?;
                    io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
                }
            }

            for entry in WalkDir::new(&extract_path).into_iter().filter_map(|e| e.ok()) {
                if entry.file_type().is_file() {
                    if let Some(e) = entry.path().extension().and_then(|s| s.to_str()) {
                        if supported_extensions.contains(&e.to_lowercase().as_str()) {
                            files.push(entry.path().to_string_lossy().into_owned());
                        }
                    }
                }
            }
        }
    } else {
        for entry in WalkDir::new(&path).max_depth(1).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                if let Some(ext) = entry.path().extension().and_then(|s| s.to_str()) {
                    if supported_extensions.contains(&ext.to_lowercase().as_str()) {
                        files.push(entry.path().to_string_lossy().into_owned());
                    }
                }
            }
        }
    }
    
    files.sort();
    Ok(files)
}

#[command]
async fn download_image(url: String, file_path: String) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;
        
    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    if !response.status().is_success() {
        return Err(format!("Failed to download image: status {}", response.status()));
    }
    
    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    
    // Ensure parent directory exists
    if let Some(parent) = std::path::Path::new(&file_path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    
    std::fs::write(&file_path, bytes).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[command]
async fn fetch_html(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;
        
    let response = client.get(&url)
        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    if !response.status().is_success() {
        return Err(format!("Failed to fetch content: status {}", response.status()));
    }
    
    let text = response.text().await.map_err(|e| e.to_string())?;
    Ok(text)
}

use headless_chrome::{Browser, LaunchOptions};

#[command]
async fn scrape_images_headless(url: String) -> Result<Vec<String>, String> {
    println!("[Rust] Starting enhanced headless scrape for: {}", url);
    
    let images = tauri::async_runtime::spawn_blocking(move || {
        let browser = Browser::new(LaunchOptions {
            headless: true,
            ..Default::default()
        }).map_err(|e| format!("Failed to launch browser: {}", e))?;

        let tab = browser.new_tab().map_err(|e| format!("Failed to create tab: {}", e))?;

        // Navigate
        tab.navigate_to(&url).map_err(|e| format!("Failed to navigate: {}", e))?;
        tab.wait_until_navigated().map_err(|e| format!("Nav failed: {}", e))?;

        // DEBUG: Proof of Load
        let title = tab.evaluate("document.title", true)
            .ok().and_then(|o| o.value).and_then(|v| v.as_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "Unknown Title".to_string());
        println!("[Rust Scraper] Debug - Page Title: {}", title);

        // 1. Wait for reader container
        let wait_script = r#"document.querySelector('#viewer, .reader, .nc-viewer, [data-role="reader"], .page-list, div[class*="viewer"]') !== null"#;
        let mut retries = 0;
        let mut found_container = false;
        while retries < 15 {
            if let Ok(remote_object) = tab.evaluate(wait_script, true) {
                if remote_object.value.and_then(|v| v.as_bool()).unwrap_or(false) {
                    found_container = true;
                    break;
                }
            }
            std::thread::sleep(std::time::Duration::from_millis(1000));
            retries += 1;
        }
        
        if !found_container {
            println!("[Rust Warning] Main viewer container not found after 15s - proceeding anyway...");
        }

        // 2. Incremental Collection (Crucial for Virtualized Lists)
        let mut collected_images: std::collections::HashSet<String> = std::collections::HashSet::new();
        let mut last_height = 0;
        let mut scroll_retries = 0;
        
        println!("[Rust Scraper] Starting incremental scroll-collection loop...");

        while scroll_retries < 12 {
            // Extract currently visible images + background images
            let extract_current_script = r#"
                (() => {
                    const results = [];
                    // 1. Standard img tags
                    document.querySelectorAll('img').forEach(img => {
                        let src = img.currentSrc || img.src || img.dataset.src || img.dataset.lazySrc || img.dataset.original || '';
                        if (src.startsWith('//')) src = 'https:' + src;
                        if (src && src.length > 50 && !src.includes('avatar') && !src.includes('logo') && !src.includes('banner')) {
                            results.push(src);
                        }
                    });
                    // 2. Background images
                    document.querySelectorAll('[style*="background-image"]').forEach(el => {
                        const style = el.style.backgroundImage;
                        const match = style.match(/url\(["']?(.*?)["']?\)/);
                        if (match && match[1]) {
                            let url = match[1];
                            if (url.startsWith('//')) url = 'https:' + url;
                            if (url.length > 50 && !url.includes('avatar')) results.push(url);
                        }
                    });
                    return results;
                })()
            "#;

            if let Ok(remote_obj) = tab.evaluate(extract_current_script, true) {
                if let Some(val) = remote_obj.value {
                    if let Ok(urls) = serde_json::from_value::<Vec<String>>(val) {
                        let start_count = collected_images.len();
                        for url in urls {
                            collected_images.insert(url);
                        }
                        if collected_images.len() > start_count {
                            println!("[Rust Scraper] Collected {} new images (Total: {})", collected_images.len() - start_count, collected_images.len());
                        }
                    }
                }
            }

            // Scroll check
            let height_obj = tab.evaluate("document.body.scrollHeight", true).map_err(|e| e.to_string())?;
            let current_height = height_obj.value.and_then(|v| v.as_u64()).unwrap_or(0);
            
            tab.evaluate("window.scrollBy(0, window.innerHeight * 1.8)", true).map_err(|e| e.to_string())?;
            std::thread::sleep(std::time::Duration::from_millis(1500));
            
            if current_height == last_height {
                scroll_retries += 1;
            } else {
                scroll_retries = 0;
                last_height = current_height;
            }
        }
        
        let mut final_urls: Vec<String> = collected_images.into_iter()
            .filter(|src| {
                let s = src.to_lowercase();
                s.ends_with(".jpg") || s.ends_with(".jpeg") || s.ends_with(".png") || s.ends_with(".webp")
            })
            .collect();
            
        // Final broad fallback if empty
        if final_urls.is_empty() {
             println!("[Rust Scraper] Incremental loop failed. Trying final broad extraction...");
             let broad_script = r#"
                Array.from(document.querySelectorAll('img')).map(i => i.currentSrc || i.src || '').filter(s => s.length > 50)
             "#;
             if let Ok(remote_obj) = tab.evaluate(broad_script, true) {
                 if let Some(val) = remote_obj.value {
                     if let Ok(urls) = serde_json::from_value::<Vec<String>>(val) {
                         final_urls = urls;
                     }
                 }
             }
        }

        println!("[Rust Scraper] Scrape complete. Found {} unique image candidate(s).", final_urls.len());
        Ok::<Vec<String>, String>(final_urls)
    }).await.map_err(|e| format!("Headless task failed: {}", e))??;

    if images.is_empty() {
        return Err("No value returned from extraction".to_string());
    }

    Ok(images)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .plugin(tauri_plugin_sql::Builder::default().build())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_cli::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
        scan_video_folder, 
        scan_manga_folder, 
        read_folder, 
        scan_chapters, 
        download_image, 
        fetch_html,
        scrape_images_headless
    ])
    .setup(|app| {
      use tauri_plugin_cli::CliExt;
      match app.cli().matches() {
        Ok(matches) => {
          if let Some(arg) = matches.args.get("path") {
            if let Some(path) = arg.value.as_str() {
              let path_str = path.to_string();
              let app_handle = app.handle().clone();
              tauri::async_runtime::spawn(async move {
                // Wait a bit for the frontend to be ready
                std::thread::sleep(std::time::Duration::from_millis(1500));
                let _ = app_handle.emit("open-path", path_str);
              });
            }
          }
        }
        Err(e) => {
          eprintln!("Failed to get CLI matches: {}", e);
        }
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
