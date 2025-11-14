#[cfg(windows)]
fn main() {
    println!("cargo:rustc-link-arg=/STACK:33554432");
    tauri_build::build();
    //   set TAURI_SIGNING_PRIVATE_KEY=H:\Github\rust-desktop-2025-tabletop\~\key\tabletopv1.key
    //   set RUSTFLAGS=-C link-args=/STACK:33554432 && cargo run --release
}


