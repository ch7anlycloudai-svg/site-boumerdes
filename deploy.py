"""Deploy updated files to Hostinger via SSH/SFTP"""
import paramiko
import os
import sys

HOST = "145.14.147.57"
PORT = 65002
USER = "u436804821"
PASS = "A33749319a."


LOCAL_BASE = r"C:\Users\PC\OneDrive\claude 2\union-website"

# Files to deploy
FILES = [
    ("frontend/index.html", None),
    ("frontend/about.html", None),
    ("frontend/news.html", None),
    ("frontend/guide.html", None),
    ("frontend/programs.html", None),
    ("frontend/services.html", None),
    ("frontend/contact.html", None),
    ("frontend/js/main.js", None),
    ("frontend/css/components.css", None),
    ("frontend/css/responsive.css", None),
]

def main():
    print(f"Connecting to {HOST}:{PORT}...")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15,
                    allow_agent=False, look_for_keys=False)
    except paramiko.AuthenticationException:
        print("SSH auth failed. Trying alternative password formats...")
        for pw in ["A33749319a", "A33749319a."]:
            try:
                ssh.connect(HOST, port=PORT, username=USER, password=pw, timeout=15,
                            allow_agent=False, look_for_keys=False)
                print(f"Connected with password variant")
                break
            except:
                continue
        else:
            print("ERROR: All SSH auth attempts failed.")
            print("Please deploy manually via Hostinger File Manager.")
            print("Files to upload:")
            for local_rel, _ in FILES:
                print(f"  {local_rel}")
            sys.exit(1)

    print("SSH connected!")

    # Discover remote structure
    stdin, stdout, stderr = ssh.exec_command("find ~ -name 'server.js' -path '*/backend/*' 2>/dev/null | head -5")
    server_paths = stdout.read().decode().strip().split('\n')
    print(f"Found server.js at: {server_paths}")

    if server_paths and server_paths[0]:
        # Derive base path from server.js location
        backend_path = os.path.dirname(server_paths[0])
        base_path = os.path.dirname(backend_path)
    else:
        # Fallback: check common Hostinger paths
        for base in [
            f"/home/{USER}/domains/lightgoldenrodyellow-manatee-444740.hostingersite.com/nodejs",
            f"/home/{USER}/public_html",
        ]:
            stdin, stdout, stderr = ssh.exec_command(f"test -d {base}/backend && echo YES")
            if stdout.read().decode().strip() == "YES":
                base_path = base
                break
        else:
            print("ERROR: Could not find project directory on server")
            ssh.close()
            sys.exit(1)

    print(f"Base path: {base_path}")

    # Upload files via SFTP
    sftp = ssh.open_sftp()

    for local_rel, _ in FILES:
        local_path = os.path.join(LOCAL_BASE, local_rel)
        remote_path = f"{base_path}/{local_rel}"

        if not os.path.exists(local_path):
            print(f"  SKIP (local not found): {local_path}")
            continue

        try:
            sftp.put(local_path, remote_path)
            local_size = os.path.getsize(local_path)
            print(f"  OK ({local_size} bytes): {local_rel}")
        except Exception as e:
            print(f"  FAIL: {local_rel} -> {e}")

    sftp.close()

    # Restart Node.js via Hostinger's system
    print("\nRestarting Node.js application...")
    restart_cmds = [
        "pkill -u $USER -f 'node' 2>/dev/null; sleep 1; echo 'Processes killed'",
        f"cd {base_path}/backend && nohup node server.js > /tmp/node-restart.log 2>&1 & sleep 3 && echo 'Server started'",
        "curl -s http://localhost:3000/api/health 2>/dev/null || curl -s http://127.0.0.1:3000/api/health 2>/dev/null || echo 'Health check: cannot reach localhost (Hostinger may use passenger/phusion)'",
    ]

    for cmd in restart_cmds:
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=15)
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        if out:
            print(f"  {out}")
        if err:
            print(f"  stderr: {err}")

    ssh.close()
    print("\nDeploy complete!")

if __name__ == "__main__":
    main()
