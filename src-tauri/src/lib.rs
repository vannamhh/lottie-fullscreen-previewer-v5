use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;

use base64::Engine;
use serde::Serialize;
use tauri::{Emitter, Manager, State};

/// Event name the frontend listens on for files opened while the app is running.
const OPEN_FILE_EVENT: &str = "lottie://open-file";

/// Extensions we accept from Finder. `.zip` is here because the app already
/// treats a zipped dotLottie payload the same as a `.lottie` file.
const SUPPORTED_EXTS: [&str; 3] = ["lottie", "json", "zip"];

/// A file handed to us by the OS, encoded so it can cross the IPC bridge.
/// The frontend rebuilds a `File` from `data` and feeds it to the existing
/// `processFile` path, so native and drag-and-drop opens share one code path.
#[derive(Clone, Serialize)]
pub struct OpenedFile {
    name: String,
    /// Base64 of the raw bytes. `.lottie` is a zip, so this has to stay binary-safe.
    data: String,
}

#[derive(Default)]
struct OpenQueue {
    /// Files that arrived before the webview was listening.
    pending: Mutex<Vec<OpenedFile>>,
    /// Flipped once the frontend has drained the queue and attached its listener.
    frontend_ready: AtomicBool,
}

fn is_supported(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| SUPPORTED_EXTS.contains(&e.to_ascii_lowercase().as_str()))
        .unwrap_or(false)
}

fn read_opened_file(path: &Path) -> Option<OpenedFile> {
    if !is_supported(path) {
        return None;
    }
    let bytes = std::fs::read(path).ok()?;
    Some(OpenedFile {
        name: path.file_name()?.to_string_lossy().into_owned(),
        data: base64::engine::general_purpose::STANDARD.encode(bytes),
    })
}

/// Route a file either straight to the webview or into the pending queue,
/// depending on whether the frontend is up yet. Doing it here (rather than
/// always queueing and always emitting) keeps a warm open from being delivered
/// twice.
fn deliver(app: &tauri::AppHandle, file: OpenedFile) {
    let queue = app.state::<OpenQueue>();
    if queue.frontend_ready.load(Ordering::SeqCst) {
        eprintln!("[open] emitting {} to the webview", file.name);
        let _ = app.emit(OPEN_FILE_EVENT, file);
    } else {
        eprintln!("[open] queueing {} until the webview is ready", file.name);
        queue.pending.lock().unwrap().push(file);
    }
}

/// Called once by the frontend on mount. Returns anything that arrived during
/// cold start and marks the webview as ready for live events from here on.
#[tauri::command]
fn take_pending_files(queue: State<OpenQueue>) -> Vec<OpenedFile> {
    let files = std::mem::take(&mut *queue.pending.lock().unwrap());
    queue.frontend_ready.store(true, Ordering::SeqCst);
    eprintln!("[open] webview ready, handed over {} queued file(s)", files.len());
    files
}

/// Files passed as CLI arguments. macOS uses `RunEvent::Opened` instead, but
/// this keeps `open -a … file` and other launch paths working.
fn files_from_args() -> Vec<PathBuf> {
    std::env::args_os()
        .skip(1)
        .map(PathBuf::from)
        .filter(|p| p.is_file() && is_supported(p))
        .collect()
}

/// Pulls every supported file out of an argv vector and hands it to the webview.
/// Windows and Linux deliver a double-clicked file this way rather than through
/// `RunEvent::Opened`.
#[cfg(any(windows, target_os = "linux"))]
fn deliver_from_argv(app: &tauri::AppHandle, argv: &[String]) {
    for path in argv.iter().skip(1).map(PathBuf::from) {
        if !path.is_file() || !is_supported(&path) {
            continue;
        }
        if let Some(file) = read_opened_file(&path) {
            deliver(app, file);
        }
    }
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_focus();
    }
}

pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default();

    // On Windows and Linux, opening a second file launches a whole new process.
    // Single-instance forwards that process's argv to the running app and exits,
    // which is what makes a warm open land in the existing window. macOS has no
    // such problem — the OS routes the file to the running app itself.
    #[cfg(any(windows, target_os = "linux"))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            deliver_from_argv(app, &argv);
        }));
    }

    builder
        .manage(OpenQueue::default())
        .invoke_handler(tauri::generate_handler![take_pending_files])
        .setup(|app| {
            for path in files_from_args() {
                if let Some(file) = read_opened_file(&path) {
                    app.state::<OpenQueue>().pending.lock().unwrap().push(file);
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("failed to build the Tauri application")
        .run(|_app, _event| {
            #[cfg(target_os = "macos")]
            handle_macos_open(_app, _event);
        });
}

/// macOS delivers Finder double-clicks and "Open With" through the run loop,
/// both on cold start and while the app is already running. Windows and Linux
/// have no equivalent — they go through argv, see `deliver_from_argv`.
#[cfg(target_os = "macos")]
fn handle_macos_open(app: &tauri::AppHandle, event: tauri::RunEvent) {
    let tauri::RunEvent::Opened { urls } = event else {
        return;
    };
    for url in urls {
        if let Ok(path) = url.to_file_path() {
            if let Some(file) = read_opened_file(&path) {
                deliver(app, file);
            }
        }
    }
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_focus();
    }
}
