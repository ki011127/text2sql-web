import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { convertNaturalLanguageToSQL, generateSQLSuggestions } from "@/lib/query-converter"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { naturalLanguageQuery, schemaContent } = await request.json()

    if (!naturalLanguageQuery) {
      return NextResponse.json({ error: "Natural language query is required" }, { status: 400 })
    }

    // 자연어를 SQL로 변환
    const result = convertNaturalLanguageToSQL(naturalLanguageQuery, schemaContent)

    // 관련 제안사항 생성
    const suggestions = generateSQLSuggestions(naturalLanguageQuery)

    return NextResponse.json({
      success: true,
      sql: result.sql,
      confidence: result.confidence,
      description: result.description,
      suggestions,
      originalQuery: naturalLanguageQuery,
    })
  } catch (error) {
    console.error("Query conversion error:", error)
    return NextResponse.json({ error: "Query conversion failed" }, { status: 500 })
  }
}
