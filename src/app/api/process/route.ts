import { type NextRequest, NextResponse } from "next/server";

interface CommandMatch { command: string; description: string; example: string; category: string; danger: boolean; }

const COMMANDS: CommandMatch[] = [
  { command: "find", description: "Search for files and directories", example: "find . -name '*.js' -type f", category: "File Search", danger: false },
  { command: "grep", description: "Search text patterns in files", example: "grep -rn 'pattern' /path/", category: "Text Search", danger: false },
  { command: "awk", description: "Pattern scanning and processing", example: "awk '{print $1}' file.txt", category: "Text Processing", danger: false },
  { command: "sed", description: "Stream editor for text transformation", example: "sed 's/old/new/g' file.txt", category: "Text Processing", danger: false },
  { command: "tar", description: "Archive files", example: "tar -czf archive.tar.gz /path/", category: "Archive", danger: false },
  { command: "curl", description: "Transfer data from/to servers", example: "curl -X GET https://api.example.com", category: "Network", danger: false },
  { command: "ssh", description: "Secure shell remote login", example: "ssh user@host -p 22", category: "Remote", danger: false },
  { command: "rsync", description: "Sync files between locations", example: "rsync -avz /src/ user@host:/dest/", category: "Sync", danger: false },
  { command: "docker", description: "Container management", example: "docker run -d -p 8080:80 nginx", category: "Containers", danger: false },
  { command: "git", description: "Version control operations", example: "git log --oneline -10", category: "Version Control", danger: false },
  { command: "chmod", description: "Change file permissions", example: "chmod 755 script.sh", category: "Permissions", danger: true },
  { command: "chown", description: "Change file ownership", example: "chown user:group file", category: "Permissions", danger: true },
  { command: "rm", description: "Remove files/directories", example: "rm -rf /tmp/cache", category: "File Ops", danger: true },
  { command: "kill", description: "Terminate processes", example: "kill -9 1234", category: "Process", danger: true },
  { command: "iptables", description: "Configure firewall rules", example: "iptables -A INPUT -p tcp --dport 80 -j ACCEPT", category: "Network", danger: true },
  { command: "dd", description: "Low-level data copy", example: "dd if=/dev/sda of=/dev/sdb bs=4M", category: "Disk", danger: true },
  { command: "wc", description: "Count lines, words, characters", example: "wc -l file.txt", category: "Text", danger: false },
  { command: "sort", description: "Sort lines of text", example: "sort -n -r file.txt", category: "Text", danger: false },
  { command: "du", description: "Disk usage", example: "du -sh /path/*", category: "Disk", danger: false },
  { command: "ps", description: "Process status", example: "ps aux | grep nginx", category: "Process", danger: false },
  { command: "top", description: "System resource monitor", example: "top -u username", category: "Monitor", danger: false },
  { command: "netstat", description: "Network statistics", example: "netstat -tlnp", category: "Network", danger: false },
  { command: "lsof", description: "List open files", example: "lsof -i :8080", category: "Network", danger: false },
  { command: "crontab", description: "Schedule tasks", example: "crontab -e", category: "Scheduling", danger: false },
  { command: "tar", description: "Extract archives", example: "tar -xzf archive.tar.gz", category: "Archive", danger: false },
];

function matchCommands(query: string): CommandMatch[] {
  const q = query.toLowerCase();
  const keywords = q.split(/\s+/);
  const scored: Array<{ cmd: CommandMatch; score: number }> = [];

  for (const cmd of COMMANDS) {
    let score = 0;
    const text = `${cmd.command} ${cmd.description} ${cmd.category} ${cmd.example}`.toLowerCase();
    for (const kw of keywords) {
      if (text.includes(kw)) score += 2;
      if (cmd.command.includes(kw)) score += 5;
      if (cmd.category.toLowerCase().includes(kw)) score += 3;
    }
    if (score > 0) scored.push({ cmd, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map(s => s.cmd);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, shell } = body;

    if (!input?.trim()) return NextResponse.json({ error: "No description provided" }, { status: 400 });

    const q = input.trim().toLowerCase();
    const matched = matchCommands(q);

    // Generate suggested commands based on common patterns
    const suggestions: Array<{ command: string; explanation: string; safe: boolean }> = [];

    if (q.includes("find") || q.includes("search") || q.includes("locate")) {
      const pattern = q.match(/(?:find|search|locate)\s+(.+?)(?:\s+in|\s+from|\s+$)/)?.[1] || "*";
      suggestions.push({ command: `find . -name '${pattern}' -type f 2>/dev/null`, explanation: "Recursively find files matching the pattern in current directory", safe: true });
      suggestions.push({ command: `grep -rn '${pattern}' . --include='*'`, explanation: "Search for text content inside files", safe: true });
    }

    if (q.includes("list") || q.includes("show") || q.includes("files")) {
      suggestions.push({ command: "ls -lah", explanation: "List all files with details in human-readable format", safe: true });
      suggestions.push({ command: "find . -maxdepth 2 -type f | head -50", explanation: "List files up to 2 levels deep", safe: true });
    }

    if (q.includes("size") || q.includes("disk") || q.includes("space")) {
      suggestions.push({ command: "du -sh * | sort -rh | head -20", explanation: "Show top 20 largest items in current directory", safe: true });
      suggestions.push({ command: "df -h", explanation: "Show disk space usage for all mounted filesystems", safe: true });
    }

    if (q.includes("process") || q.includes("running") || q.includes("port")) {
      const port = q.match(/port\s*(\d+)/)?.[1] || "8080";
      suggestions.push({ command: `lsof -i :${port}`, explanation: `Check what's using port ${port}`, safe: true });
      suggestions.push({ command: "ps aux --sort=-%mem | head -10", explanation: "Top 10 processes by memory usage", safe: true });
    }

    if (q.includes("download") || q.includes("wget") || q.includes("fetch")) {
      const url = q.match(/https?:\/\/[^\s]+/)?.[0] || "https://example.com/file";
      suggestions.push({ command: `curl -LO ${url}`, explanation: "Download file with original filename", safe: true });
      suggestions.push({ command: `wget -c ${url}`, explanation: "Download with resume support", safe: true });
    }

    if (q.includes("compress") || q.includes("zip") || q.includes("archive")) {
      suggestions.push({ command: "tar -czf archive.tar.gz /path/to/dir", explanation: "Create gzipped tar archive", safe: true });
      suggestions.push({ command: "tar -xzf archive.tar.gz", explanation: "Extract gzipped tar archive", safe: true });
    }

    if (q.includes("monitor") || q.includes("watch") || q.includes("live")) {
      suggestions.push({ command: "watch -n 2 'df -h'", explanation: "Monitor disk space every 2 seconds", safe: true });
      suggestions.push({ command: "tail -f /var/log/syslog", explanation: "Follow system log in real-time", safe: true });
    }

    if (q.includes("kill") || q.includes("stop") || q.includes("terminate")) {
      const proc = q.match(/(?:kill|stop|terminate)\s+(\w+)/)?.[1] || "process_name";
      suggestions.push({ command: `pkill -f ${proc}`, explanation: `Kill all processes matching '${proc}'`, safe: false });
      suggestions.push({ command: `kill -15 $(pgrep -f ${proc})`, explanation: `Gracefully terminate '${proc}' (SIGTERM)`, safe: false });
    }

    // Default suggestions if nothing matched
    if (suggestions.length === 0 && matched.length > 0) {
      for (const cmd of matched.slice(0, 3)) {
        suggestions.push({ command: cmd.example, explanation: cmd.description, safe: !cmd.danger });
      }
    }

    if (suggestions.length === 0) {
      suggestions.push({ command: `echo "No matching command found for: ${input}"`, explanation: "Try being more specific. Examples: 'find files', 'check disk space', 'list processes on port 8080'", safe: true });
    }

    return NextResponse.json({
      input,
      shell: shell || "bash",
      suggestions,
      matchedCommands: matched,
      warning: suggestions.some(s => !s.safe) ? "⚠️ Some suggested commands may modify or delete data. Review before executing." : null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 });
  }
}
