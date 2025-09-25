import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md text-center">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">SQLite Query Tool</h1>
            <p className="text-muted-foreground mt-2">SQLite 파일을 업로드하고 자연어로 질문하여 데이터를 조회하세요</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild size="lg">
              <Link href="/auth/login">로그인</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/sign-up">회원가입</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
