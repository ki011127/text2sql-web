import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sqlQuery, sqliteData } = await request.json()

    if (!sqlQuery || !sqliteData) {
      return NextResponse.json({ error: "SQL query and SQLite data are required" }, { status: 400 })
    }

    // 위험한 SQL 명령어 차단
    const dangerousCommands = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "CREATE", "TRUNCATE"]
    const upperQuery = sqlQuery.toUpperCase()

    for (const command of dangerousCommands) {
      if (upperQuery.includes(command)) {
        return NextResponse.json({ error: `${command} commands are not allowed for security reasons` }, { status: 400 })
      }
    }

    // 실제 SQLite 쿼리 실행을 위해서는 sqlite3 라이브러리가 필요합니다
    // 현재는 예시 데이터를 반환합니다
    // TODO: 실제 SQLite 쿼리 실행 구현

    // 예시 응답 데이터
    const mockResults = [
      { id: 1, name: "홍길동", email: "hong@example.com", created_at: "2024-01-01" },
      { id: 2, name: "김철수", email: "kim@example.com", created_at: "2024-01-02" },
      { id: 3, name: "이영희", email: "lee@example.com", created_at: "2024-01-03" },
    ]

    return NextResponse.json({
      success: true,
      results: mockResults,
      query: sqlQuery,
      rowCount: mockResults.length,
    })
  } catch (error) {
    console.error("Query execution error:", error)
    return NextResponse.json({ error: "Query execution failed" }, { status: 500 })
  }
}
