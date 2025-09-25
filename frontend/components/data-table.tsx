"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, ChevronLeft, ChevronRight, FileText, Table } from "lucide-react"

interface DataTableProps {
  data: any[]
  title?: string
  description?: string
}

export default function DataTable({ data, title = "쿼리 결과", description }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  if (!data || data.length === 0) {
    return (
      <Card className="border-l-4 border-l-slate-300">
        <CardHeader>
          <CardTitle className="text-slate-600">데이터 없음</CardTitle>
          <CardDescription>표시할 데이터가 없습니다.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const columns = Object.keys(data[0])

  // 검색 필터링
  const filteredData = data.filter((row) =>
    Object.values(row).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // 정렬
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0

    const aValue = a[sortColumn]
    const bValue = b[sortColumn]

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  // 페이지네이션
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleExportCSV = () => {
    const csvContent = [columns.join(","), ...sortedData.map((row) => columns.map((col) => row[col]).join(","))].join(
      "\n",
    )

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "query_results.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(sortedData, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "query_results.json")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-blue-700">{title}</CardTitle>
            <CardDescription>{description || `${filteredData.length}개의 결과가 찾아졌습니다`}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={handleExportJSON} variant="outline" size="sm">
              <Table className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 검색 및 필터 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="데이터 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5개씩</SelectItem>
                <SelectItem value="10">10개씩</SelectItem>
                <SelectItem value="25">25개씩</SelectItem>
                <SelectItem value="50">50개씩</SelectItem>
                <SelectItem value="100">100개씩</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 테이블 */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b">
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort(column)}
                    >
                      <div className="flex items-center gap-2">
                        {column}
                        {sortColumn === column && (
                          <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-slate-50 transition-colors">
                    {columns.map((column) => (
                      <td key={column} className="px-4 py-3 text-slate-600">
                        <div className="max-w-xs truncate" title={String(row[column])}>
                          {String(row[column])}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} / {filteredData.length}개
                결과
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
