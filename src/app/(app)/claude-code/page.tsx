import { redirect } from "next/navigation";

/** 예전 주소(Claude Code 연결). MCP 를 쓰는 도구 전반으로 넓히며 /mcp 로 옮겼다. */
export default function OldClaudeCodeConnection() {
  redirect("/mcp");
}
