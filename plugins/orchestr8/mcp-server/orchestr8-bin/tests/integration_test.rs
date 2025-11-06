/*!
 * Integration tests for orchestr8-bin MCP server
 *
 * Note: These tests spawn the MCP server as a subprocess and communicate via stdio.
 * The server uses tokio async I/O and responds to JSON-RPC requests.
 *
 * Tests are marked with #[serial] to ensure they run sequentially, since spawning
 * multiple server instances in parallel can cause port conflicts and resource issues.
 */

use serde_json::{json, Value};
use std::io::{BufRead, BufReader, Write};
use std::process::{Command, Stdio};
use std::time::Duration;
use std::thread;
use serial_test::serial;

#[test]
#[serial]
fn test_mcp_initialize() {
    // Use env! macro to get compile-time manifest dir, then walk up to repo root
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let cargo_dir = std::path::PathBuf::from(manifest_dir);

    // Walk up: orchestr8-bin -> mcp-server -> orchestr8 -> plugins -> repo_root
    let repo_root = cargo_dir
        .parent()     // mcp-server
        .and_then(|p| p.parent())     // orchestr8
        .and_then(|p| p.parent())     // plugins
        .and_then(|p| p.parent())     // repo root
        .expect("Failed to find repo root");

    let root = repo_root.to_string_lossy().to_string();
    let agent_dir = repo_root
        .join("plugins/orchestr8/agent-definitions")
        .to_string_lossy()
        .to_string();

    let binary_path = cargo_dir
        .join("target/release/orchestr8-bin")
        .to_string_lossy()
        .to_string();

    let mut child = Command::new(&binary_path)
        .arg("--root")
        .arg(&root)
        .arg("--agent-dir")
        .arg(&agent_dir)
        .arg("--log-level")
        .arg("error")  // Suppress INFO logs to avoid cluttering stdout
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())  // Discard stderr (logs go there)
        .spawn()
        .expect("Failed to start server");

    // Give server time to initialize (tokio startup takes time)
    thread::sleep(Duration::from_millis(1000));

    let mut stdin = child.stdin.take().expect("Failed to open stdin");
    let stdout = child.stdout.take().expect("Failed to open stdout");
    let mut reader = BufReader::new(stdout);

    // Send initialize request
    let request = json!({
        "jsonrpc": "2.0",
        "method": "initialize",
        "params": {},
        "id": 1
    });

    writeln!(stdin, "{}", request.to_string()).expect("Failed to write request");
    stdin.flush().expect("Failed to flush");

    // Read response with timeout retry logic
    let mut line = String::new();
    let mut retries = 0;
    let max_retries = 5;

    loop {
        line.clear();
        match reader.read_line(&mut line) {
            Ok(0) => {
                panic!("Server closed connection without responding");
            }
            Ok(_) => {
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    retries += 1;
                    if retries > max_retries {
                        panic!("Too many empty lines from server");
                    }
                    thread::sleep(Duration::from_millis(100));
                    continue;
                }

                // Got a non-empty line, try to parse it
                let response: Value = match serde_json::from_str(trimmed) {
                    Ok(v) => v,
                    Err(e) => {
                        eprintln!("Failed to parse response: {} (raw: {})", e, trimmed);
                        panic!("Failed to parse response: {}", e);
                    }
                };

                assert_eq!(response["jsonrpc"], "2.0");
                assert_eq!(response["id"], 1);
                assert!(response["result"].is_object());
                assert_eq!(response["result"]["serverInfo"]["name"], "orchestr8-mcp-server");
                break;
            }
            Err(e) => panic!("Failed to read response: {}", e),
        }
    }

    let _ = child.kill();
}

#[test]
#[serial]
fn test_mcp_agent_query() {
    // Use env! macro to get compile-time manifest dir, then walk up to repo root
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let cargo_dir = std::path::PathBuf::from(manifest_dir);

    // Walk up: orchestr8-bin -> mcp-server -> orchestr8 -> plugins -> repo_root
    let repo_root = cargo_dir
        .parent()     // mcp-server
        .and_then(|p| p.parent())     // orchestr8
        .and_then(|p| p.parent())     // plugins
        .and_then(|p| p.parent())     // repo root
        .expect("Failed to find repo root");

    let root = repo_root.to_string_lossy().to_string();
    let agent_dir = repo_root
        .join("plugins/orchestr8/agent-definitions")
        .to_string_lossy()
        .to_string();

    let binary_path = cargo_dir
        .join("target/release/orchestr8-bin")
        .to_string_lossy()
        .to_string();

    let mut child = Command::new(&binary_path)
        .arg("--root")
        .arg(&root)
        .arg("--agent-dir")
        .arg(&agent_dir)
        .arg("--log-level")
        .arg("error")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .expect("Failed to start server");

    // Give server time to initialize
    thread::sleep(Duration::from_millis(1000));

    let mut stdin = child.stdin.take().expect("Failed to open stdin");
    let stdout = child.stdout.take().expect("Failed to open stdout");
    let mut reader = BufReader::new(stdout);

    // Send query request
    let request = json!({
        "jsonrpc": "2.0",
        "method": "agents/query",
        "params": {
            "context": "react",
            "limit": 5
        },
        "id": 2
    });

    writeln!(stdin, "{}", request.to_string()).expect("Failed to write request");
    stdin.flush().expect("Failed to flush");

    // Read response
    let mut line = String::new();
    let mut retries = 0;

    loop {
        line.clear();
        match reader.read_line(&mut line) {
            Ok(0) => panic!("Server closed connection without responding"),
            Ok(_) => {
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    retries += 1;
                    if retries > 5 {
                        panic!("Too many empty lines from server");
                    }
                    thread::sleep(Duration::from_millis(100));
                    continue;
                }

                let response: Value = serde_json::from_str(trimmed).expect("Failed to parse response");
                assert_eq!(response["jsonrpc"], "2.0");
                assert_eq!(response["id"], 2);
                assert!(response["result"].is_object());
                assert!(response["result"]["agents"].is_array());
                break;
            }
            Err(e) => panic!("Failed to read response: {}", e),
        }
    }

    let _ = child.kill();
}

#[test]
#[serial]
fn test_mcp_health() {
    // Use env! macro to get compile-time manifest dir, then walk up to repo root
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let cargo_dir = std::path::PathBuf::from(manifest_dir);

    // Walk up: orchestr8-bin -> mcp-server -> orchestr8 -> plugins -> repo_root
    let repo_root = cargo_dir
        .parent()     // mcp-server
        .and_then(|p| p.parent())     // orchestr8
        .and_then(|p| p.parent())     // plugins
        .and_then(|p| p.parent())     // repo root
        .expect("Failed to find repo root");

    let root = repo_root.to_string_lossy().to_string();
    let agent_dir = repo_root
        .join("plugins/orchestr8/agent-definitions")
        .to_string_lossy()
        .to_string();

    let binary_path = cargo_dir
        .join("target/release/orchestr8-bin")
        .to_string_lossy()
        .to_string();

    let mut child = Command::new(&binary_path)
        .arg("--root")
        .arg(&root)
        .arg("--agent-dir")
        .arg(&agent_dir)
        .arg("--log-level")
        .arg("error")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .expect("Failed to start server");

    // Give server time to initialize
    thread::sleep(Duration::from_millis(1000));

    let mut stdin = child.stdin.take().expect("Failed to open stdin");
    let stdout = child.stdout.take().expect("Failed to open stdout");
    let mut reader = BufReader::new(stdout);

    // Send health check
    let request = json!({
        "jsonrpc": "2.0",
        "method": "health",
        "params": {},
        "id": 3
    });

    writeln!(stdin, "{}", request.to_string()).expect("Failed to write request");
    stdin.flush().expect("Failed to flush");

    // Read response
    let mut line = String::new();
    let mut retries = 0;

    loop {
        line.clear();
        match reader.read_line(&mut line) {
            Ok(0) => panic!("Server closed connection without responding"),
            Ok(_) => {
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    retries += 1;
                    if retries > 5 {
                        panic!("Too many empty lines from server");
                    }
                    thread::sleep(Duration::from_millis(100));
                    continue;
                }

                let response: Value = serde_json::from_str(trimmed).expect("Failed to parse response");
                assert_eq!(response["jsonrpc"], "2.0");
                assert_eq!(response["id"], 3);
                assert_eq!(response["result"]["status"], "healthy");
                assert!(response["result"]["uptime_ms"].is_number());
                assert!(response["result"]["memory_mb"].is_number());
                break;
            }
            Err(e) => panic!("Failed to read response: {}", e),
        }
    }

    let _ = child.kill();
}
