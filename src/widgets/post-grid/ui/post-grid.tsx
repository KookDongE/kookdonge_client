"use client"

import { Heart } from "lucide-react"
import { useState } from "react"

import type { ClubPost } from "@/entities/post"
import { Dialog, DialogContent } from "@/shared/ui/dialog"

interface PostGridProps {
  posts: ClubPost[]
}

export function PostGrid({ posts }: PostGridProps) {
  const [selectedPost, setSelectedPost] = useState<ClubPost | null>(null)

  if (posts.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        <p>아직 포스트가 없어요.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => (
          <button
            key={post.feedId}
            onClick={() => setSelectedPost(post)}
            className="bg-muted relative aspect-square overflow-hidden transition-opacity hover:opacity-90"
          >
            <img
              src={post.postUrls?.[0] || post.imageUrl || "/placeholder.svg"}
              alt={post.content || post.caption || ""}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors hover:bg-black/10" />
          </button>
        ))}
      </div>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-lg p-0">
          {selectedPost && (
            <div className="space-y-4">
              <div className="bg-muted relative aspect-square overflow-hidden">
                <img
                  src={selectedPost.postUrls?.[0] || selectedPost.imageUrl || "/placeholder.svg"}
                  alt={selectedPost.content || selectedPost.caption || ""}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-3 px-6 pb-6">
                <p className="text-sm leading-relaxed">{selectedPost.content || selectedPost.caption}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
