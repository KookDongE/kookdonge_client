"use client"

import { getPostsByClubId } from "@/entities"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { use, useState } from "react"

import { useToast } from "@/shared/lib/hooks/use-toast"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

export default function AdminPostsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [posts, setPosts] = useState(getPostsByClubId(Number(id)))

  const handleDeletePost = (postId: number | string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    toast({
      title: "포스트가 삭제되었습니다",
    })
  }

  return (
    <div className="bg-background min-h-screen pb-6">
      {/* Header */}
      <div className="bg-background border-border sticky top-0 z-40 border-b">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="hover:bg-accent rounded-lg p-2 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">피드 관리</h1>
            <p className="text-muted-foreground text-sm">총 {posts.length}개 포스트</p>
          </div>
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            업로드
          </Button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {posts.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">
            <p>아직 포스트가 없습니다.</p>
            <p className="mt-2 text-sm">첫 포스트를 업로드해 보세요!</p>
          </div>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="bg-muted h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={post.postUrls?.[0] || post.imageUrl || "/placeholder.svg"}
                      alt={post.content || post.caption || ""}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="line-clamp-2 text-sm leading-relaxed">{post.content || post.caption}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground text-xs">
                        {post.likeCount && <span>좋아요 {post.likeCount}</span>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => post.id && handleDeletePost(post.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
