#[cfg(windows)]
fn main() {
    println!("cargo:rustc-link-arg=/STACK:33554432");
    tauri_build::build();
}

#[cfg(not(windows))]
fn main() {
    tauri_build::build();
}
