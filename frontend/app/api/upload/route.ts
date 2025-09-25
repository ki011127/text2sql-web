import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    // 실제 업로드/검증 로직은 다 빼고, 무조건 성공으로 응답
    return NextResponse.json({
      success: true,
      sqliteData: "dummy_sqlite_base64", // 더미 데이터
      fileInfo: {
        sqliteFileName: "mock.sqlite",
        sqliteFileSize: 12345,
        schemaFileName: "mock_schema.sql",
        schemaContent: "-- mock schema here",
        uploadedAt: new Date().toISOString(),
        userId: "mock-user",
      },
      message: "Files uploaded successfully (mock)",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "mock upload error" }, { status: 500 })
  }
}
