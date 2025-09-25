"use client"

import type React from "react"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Upload, Database, MessageSquare, LogOut, FileText, CheckCircle, Lightbulb } from "lucide-react"
import { useRouter } from "next/navigation"
import DataTable from "@/components/data-table"

interface DashboardClientProps {
  user: User
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [sqliteFile, setSqliteFile] = useState<File | null>(null)
  const [schemaFile, setSchemaFile] = useState<File | null>(null)
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("")
  const [generatedSQL, setGeneratedSQL] = useState("")
  const [queryResults, setQueryResults] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedData, setUploadedData] = useState<string | null>(null)
  const [schemaContent, setSchemaContent] = useState<string>("")
  const [uploadStatus, setUploadStatus] = useState<string>("")
  const [queryConfidence, setQueryConfidence] = useState<number>(0)
  const [queryDescription, setQueryDescription] = useState<string>("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleSqliteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.match(/\.(sqlite|db|sqlite3)$/i)) {
      setSqliteFile(file)
      setUploadStatus("")
    } else {
      alert("SQLite 파일만 업로드 가능합니다 (.sqlite, .db, .sqlite3)")
    }
  }

  const handleSchemaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSchemaFile(file)
    }
  }

  const handleUploadFiles = async () => {
    if (!sqliteFile) {
      alert("SQLite 파일을 선택해주세요.")
      return
    }

    setIsUploading(true)
    setUploadStatus("파일 업로드 중...")

    try {
      const formData = new FormData()
      formData.append("sqliteFile", sqliteFile)
      if (schemaFile) {
        formData.append("schemaFile", schemaFile)
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setUploadedData(result.sqliteData)
        setSchemaContent(result.fileInfo.schemaContent || "")
        setUploadStatus("파일 업로드 완료!")
        setSuggestions([
          "사용자는 몇 명인가요?",
          "모든 사용자를 보여주세요",
          "테이블 목록을 보여주세요",
          "최근에 가입한 사용자는 누구인가요?",
          "월별 가입 통계를 보여주세요",
        ])
      } else {
        throw new Error(result.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setUploadStatus("업로드 실패")
      alert("파일 업로드 중 오류가 발생했습니다.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleConvertQuery = async () => {
    if (!naturalLanguageQuery.trim()) {
      alert("질문을 입력해주세요.")
      return
    }

    if (!uploadedData) {
      alert("먼저 SQLite 파일을 업로드해주세요.")
      return
    }

    setIsProcessing(true)
    try {
      const convertResponse = await fetch("/api/convert-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          naturalLanguageQuery,
          schemaContent,
        }),
      })

      const convertResult = await convertResponse.json()

      if (convertResult.success) {
        setGeneratedSQL(convertResult.sql)
        setQueryConfidence(convertResult.confidence)
        setQueryDescription(convertResult.description)
        setSuggestions(convertResult.suggestions)

        const queryResponse = await fetch("/api/query-sqlite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sqlQuery: convertResult.sql,
            sqliteData: uploadedData,
          }),
        })

        const queryResult = await queryResponse.json()

        if (queryResult.success) {
          setQueryResults(queryResult.results)
        } else {
          throw new Error(queryResult.error || "Query execution failed")
        }
      } else {
        throw new Error(convertResult.error || "Query conversion failed")
      }
    } catch (error) {
      console.error("Query conversion error:", error)
      alert("쿼리 변환 중 오류가 발생했습니다.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setNaturalLanguageQuery(suggestion)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">SQLite Query Tool</h1>
                <p className="text-sm text-slate-600">자연어로 데이터베이스를 조회하세요</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">안녕하세요, {user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* File Upload Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  SQLite 파일 업로드
                </CardTitle>
                <CardDescription>분석할 SQLite 데이터베이스 파일을 업로드하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept=".sqlite,.db,.sqlite3"
                    onChange={handleSqliteFileChange}
                    className="cursor-pointer"
                  />
                  {sqliteFile && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Database className="h-4 w-4" />
                      {sqliteFile.name} ({(sqliteFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                  {uploadStatus && (
                    <div className="flex items-center gap-2 text-sm">
                      {uploadStatus.includes("완료") ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Upload className="h-4 w-4 text-blue-600" />
                      )}
                      <span className={uploadStatus.includes("완료") ? "text-green-600" : "text-blue-600"}>
                        {uploadStatus}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-green-200 hover:border-green-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  스키마 파일 업로드 (선택사항)
                </CardTitle>
                <CardDescription>
                  데이터베이스 스키마 정보를 제공하면 더 정확한 쿼리를 생성할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept=".sql,.txt,.md"
                    onChange={handleSchemaFileChange}
                    className="cursor-pointer"
                  />
                  {schemaFile && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <FileText className="h-4 w-4" />
                      {schemaFile.name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Button */}
          {sqliteFile && !uploadedData && (
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <Button onClick={handleUploadFiles} disabled={isUploading} className="w-full" size="lg">
                  {isUploading ? "업로드 중..." : "파일 업로드"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Query Input Section */}
          {uploadedData && (
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  자연어 질문
                </CardTitle>
                <CardDescription>데이터에 대해 궁금한 것을 자연어로 질문해보세요</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="예: 지난 달에 가입한 사용자는 몇 명인가요?"
                    value={naturalLanguageQuery}
                    onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />

                  {suggestions.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Lightbulb className="h-4 w-4" />
                        추천 질문:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer hover:bg-purple-50"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleConvertQuery}
                    disabled={isProcessing || !naturalLanguageQuery.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isProcessing ? "변환 중..." : "SQL로 변환하기"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated SQL Section */}
          {generatedSQL && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-orange-700">생성된 SQL 쿼리</CardTitle>
                    <CardDescription>{queryDescription}</CardDescription>
                  </div>
                  <Badge variant={queryConfidence > 0.7 ? "default" : queryConfidence > 0.4 ? "secondary" : "outline"}>
                    신뢰도: {Math.round(queryConfidence * 100)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{generatedSQL}</pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Query Results Section */}
          {queryResults.length > 0 && (
            <DataTable
              data={queryResults}
              title="쿼리 결과"
              description={`${queryResults.length}개의 결과가 찾아졌습니다`}
            />
          )}
        </div>
      </main>
    </div>
  )
}
