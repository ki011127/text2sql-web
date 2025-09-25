interface QueryPattern {
  pattern: RegExp
  template: string
  description: string
}

const queryPatterns: QueryPattern[] = [
  // 사용자 관련 쿼리
  {
    pattern: /사용자.*몇.*명/i,
    template: "SELECT COUNT(*) as user_count FROM users;",
    description: "사용자 수 조회",
  },
  {
    pattern: /모든.*사용자/i,
    template: "SELECT * FROM users LIMIT 100;",
    description: "모든 사용자 조회",
  },
  {
    pattern: /최근.*가입.*사용자/i,
    template: "SELECT * FROM users ORDER BY created_at DESC LIMIT 10;",
    description: "최근 가입한 사용자",
  },
  {
    pattern: /(지난|작년|올해).*가입/i,
    template: "SELECT * FROM users WHERE created_at >= date('now', '-1 year') ORDER BY created_at DESC;",
    description: "지난 기간 가입 사용자",
  },

  // 이메일 관련 쿼리
  {
    pattern: /이메일.*포함.*사용자/i,
    template: "SELECT * FROM users WHERE email IS NOT NULL AND email != '';",
    description: "이메일이 있는 사용자",
  },
  {
    pattern: /gmail.*사용자/i,
    template: "SELECT * FROM users WHERE email LIKE '%@gmail.com';",
    description: "Gmail 사용자",
  },

  // 이름 검색
  {
    pattern: /이름.*([가-힣]+).*사용자/i,
    template: "SELECT * FROM users WHERE name LIKE '%$1%';",
    description: "특정 이름을 가진 사용자",
  },

  // 날짜 관련 쿼리
  {
    pattern: /오늘.*가입/i,
    template: "SELECT * FROM users WHERE date(created_at) = date('now');",
    description: "오늘 가입한 사용자",
  },
  {
    pattern: /이번.*달.*가입/i,
    template: "SELECT * FROM users WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now');",
    description: "이번 달 가입한 사용자",
  },

  // 통계 쿼리
  {
    pattern: /월별.*가입.*통계/i,
    template:
      "SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM users GROUP BY strftime('%Y-%m', created_at) ORDER BY month DESC;",
    description: "월별 가입 통계",
  },
  {
    pattern: /도메인별.*통계/i,
    template:
      "SELECT substr(email, instr(email, '@') + 1) as domain, COUNT(*) as count FROM users WHERE email IS NOT NULL GROUP BY domain ORDER BY count DESC;",
    description: "이메일 도메인별 통계",
  },

  // 기본 패턴들
  {
    pattern: /.*테이블.*목록/i,
    template: "SELECT name FROM sqlite_master WHERE type='table';",
    description: "테이블 목록 조회",
  },
  {
    pattern: /.*스키마.*구조/i,
    template: "SELECT sql FROM sqlite_master WHERE type='table';",
    description: "테이블 스키마 조회",
  },
]

export function convertNaturalLanguageToSQL(
  query: string,
  schemaInfo?: string,
): {
  sql: string
  confidence: number
  description: string
} {
  // 쿼리 정규화
  const normalizedQuery = query.trim().toLowerCase()

  // 패턴 매칭
  for (const pattern of queryPatterns) {
    const match = normalizedQuery.match(pattern.pattern)
    if (match) {
      let sql = pattern.template

      // 매칭된 그룹을 템플릿에 적용
      if (match.length > 1) {
        for (let i = 1; i < match.length; i++) {
          sql = sql.replace(`$${i}`, match[i])
        }
      }

      return {
        sql,
        confidence: 0.8,
        description: pattern.description,
      }
    }
  }

  // 키워드 기반 기본 쿼리 생성
  if (normalizedQuery.includes("사용자") || normalizedQuery.includes("user")) {
    return {
      sql: "SELECT * FROM users LIMIT 10;",
      confidence: 0.5,
      description: "기본 사용자 조회",
    }
  }

  if (normalizedQuery.includes("모든") || normalizedQuery.includes("전체")) {
    return {
      sql: "SELECT name FROM sqlite_master WHERE type='table';",
      confidence: 0.4,
      description: "테이블 목록 조회",
    }
  }

  // 기본 폴백 쿼리
  return {
    sql: "SELECT name FROM sqlite_master WHERE type='table';",
    confidence: 0.2,
    description: "기본 테이블 목록 조회 (질문을 더 구체적으로 해주세요)",
  }
}

export function extractTableNames(schemaInfo: string): string[] {
  const tableNames: string[] = []
  const createTableRegex = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([`"]?)(\w+)\1/gi
  let match

  while ((match = createTableRegex.exec(schemaInfo)) !== null) {
    tableNames.push(match[2])
  }

  return tableNames
}

export function generateSQLSuggestions(query: string): string[] {
  const suggestions = [
    "사용자는 몇 명인가요?",
    "모든 사용자를 보여주세요",
    "최근에 가입한 사용자는 누구인가요?",
    "Gmail을 사용하는 사용자를 찾아주세요",
    "월별 가입 통계를 보여주세요",
    "테이블 목록을 보여주세요",
    "오늘 가입한 사용자가 있나요?",
    "이메일 도메인별 통계를 보여주세요",
  ]

  return suggestions.filter((suggestion) => suggestion.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
}
