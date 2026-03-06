import {
  useInfiniteQuery,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query'
import { postsApi } from '@/api'
import { QUERY_KEYS } from './queryClient'
import type { Post, CreatePostPayload, ReactionType, PaginatedResponse } from '@/types'

// Shared helper: apply an update function to every post in an InfiniteData structure
function updateInfinitePost(
  old: InfiniteData<PaginatedResponse<Post>> | undefined,
  fn: (post: Post) => Post
): InfiniteData<PaginatedResponse<Post>> | undefined {
  if (!old) return old
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      results: page.results.map(fn),
    })),
  }
}

export function usePostQuery(postId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.POST(postId),
    queryFn: () => postsApi.getPost(postId),
    enabled: !!postId,
  })
}

export function useFeedQuery() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.FEED,
    queryFn: ({ pageParam = 1 }) => postsApi.getFeed(pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
  })
}

export function useUserPostsQuery(username: string) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.USER_POSTS(username),
    queryFn: ({ pageParam = 1 }) => postsApi.getUserPosts(username, pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
    enabled: !!username,
  })
}

export function useCommunityFeedQuery(communityId: number) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.COMMUNITY_FEED(communityId),
    queryFn: ({ pageParam = 1 }) => postsApi.getCommunityFeed(communityId, pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
  })
}

export function useCommentsQuery(postId: number) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.COMMENTS(postId),
    queryFn: ({ pageParam = 1 }) => postsApi.getComments(postId, pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
  })
}

export function useBookmarksQuery() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.BOOKMARKS,
    queryFn: ({ pageParam = 1 }) => postsApi.getBookmarks(pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
  })
}

export function useCreatePost(communityId?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['create-post'],
    mutationFn: (payload: CreatePostPayload) =>
      postsApi.createPost({ ...payload, community: communityId }),
    onSuccess: (newPost) => {
      // Prepend the new post to the feed immediately so it appears without waiting for refetch
      qc.setQueryData(
        QUERY_KEYS.FEED,
        (old: InfiniteData<PaginatedResponse<Post>> | undefined) => {
          if (!old || !old.pages.length) return old
          return {
            ...old,
            pages: [
              { ...old.pages[0], results: [newPost, ...old.pages[0].results] },
              ...old.pages.slice(1),
            ],
          }
        }
      )
      if (communityId) {
        qc.setQueryData(
          QUERY_KEYS.COMMUNITY_FEED(communityId),
          (old: InfiniteData<PaginatedResponse<Post>> | undefined) => {
            if (!old || !old.pages.length) return old
            return {
              ...old,
              pages: [
                { ...old.pages[0], results: [newPost, ...old.pages[0].results] },
                ...old.pages.slice(1),
              ],
            }
          }
        )
      }
      // Invalidate in the background to sync any server-side ordering/state
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FEED, refetchType: 'none' })
      if (communityId) {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.COMMUNITY_FEED(communityId), refetchType: 'none' })
      }
    },
  })
}

export function useIsCreatingPost() {
  const states = useMutationState({
    filters: { mutationKey: ['create-post'], status: 'pending' },
  })
  return states.length > 0
}

export function useEditPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, payload }: { postId: number; payload: { caption?: string; content?: string } }) =>
      postsApi.editPost(postId, payload),

    onMutate: async ({ postId, payload }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.FEED })
      await qc.cancelQueries({ queryKey: ['posts', 'community'] })
      await qc.cancelQueries({ queryKey: QUERY_KEYS.POST(postId) })

      const previousFeed = qc.getQueryData(QUERY_KEYS.FEED)
      const previousPost = qc.getQueryData<Post>(QUERY_KEYS.POST(postId))
      const allCommunityFeeds = qc.getQueriesData<InfiniteData<PaginatedResponse<Post>>>({
        queryKey: ['posts', 'community'],
      })

      const applyEdit = (post: Post): Post => {
        if (post.id !== postId) return post
        return {
          ...post,
          ...(payload.caption !== undefined && { caption: payload.caption }),
          ...(payload.content !== undefined && { content: payload.content }),
        }
      }

      qc.setQueryData(
        QUERY_KEYS.FEED,
        (old: InfiniteData<PaginatedResponse<Post>> | undefined) => updateInfinitePost(old, applyEdit)
      )
      for (const [key, data] of allCommunityFeeds) {
        qc.setQueryData(key as QueryKey, updateInfinitePost(data, applyEdit))
      }
      if (previousPost) {
        qc.setQueryData<Post>(QUERY_KEYS.POST(postId), applyEdit(previousPost))
      }

      return { previousFeed, previousPost, allCommunityFeeds }
    },

    onSuccess: (updatedPost, { postId }) => {
      // Replace optimistic data with the actual server response
      const applyServer = (post: Post): Post => post.id === postId ? updatedPost : post

      qc.setQueryData(
        QUERY_KEYS.FEED,
        (old: InfiniteData<PaginatedResponse<Post>> | undefined) => updateInfinitePost(old, applyServer)
      )
      const allCommunityFeeds = qc.getQueriesData<InfiniteData<PaginatedResponse<Post>>>({
        queryKey: ['posts', 'community'],
      })
      for (const [key, data] of allCommunityFeeds) {
        qc.setQueryData(key as QueryKey, updateInfinitePost(data, applyServer))
      }
      qc.setQueryData<Post>(QUERY_KEYS.POST(postId), updatedPost)
    },

    onError: (_err, { postId }, context) => {
      if (context?.previousFeed) qc.setQueryData(QUERY_KEYS.FEED, context.previousFeed)
      if (context?.previousPost) qc.setQueryData(QUERY_KEYS.POST(postId), context.previousPost)
      for (const [key, data] of context?.allCommunityFeeds ?? []) {
        qc.setQueryData(key as QueryKey, data)
      }
    },

    onSettled: (_data, _err, { postId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FEED, refetchType: 'none' })
      qc.invalidateQueries({ queryKey: ['posts', 'community'], refetchType: 'none' })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POST(postId), refetchType: 'none' })
    },
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => postsApi.deletePost(postId),

    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.FEED })
      await qc.cancelQueries({ queryKey: ['posts', 'community'] })
      await qc.cancelQueries({ queryKey: ['posts', 'user'] })
      await qc.cancelQueries({ queryKey: QUERY_KEYS.BOOKMARKS })

      const previousFeed = qc.getQueryData(QUERY_KEYS.FEED)
      const previousBookmarks = qc.getQueryData(QUERY_KEYS.BOOKMARKS)
      const allCommunityFeeds = qc.getQueriesData<InfiniteData<PaginatedResponse<Post>>>({ queryKey: ['posts', 'community'] })
      const allUserFeeds = qc.getQueriesData<InfiniteData<PaginatedResponse<Post>>>({ queryKey: ['posts', 'user'] })

      const removePost = (page: PaginatedResponse<Post>) => ({
        ...page,
        results: page.results.filter((p) => p.id !== postId),
      })

      qc.setQueryData(
        QUERY_KEYS.FEED,
        (old: InfiniteData<PaginatedResponse<Post>> | undefined) =>
          old ? { ...old, pages: old.pages.map(removePost) } : old
      )
      for (const [key, data] of allCommunityFeeds) {
        if (data) qc.setQueryData(key as QueryKey, { ...data, pages: data.pages.map(removePost) })
      }
      for (const [key, data] of allUserFeeds) {
        if (data) qc.setQueryData(key as QueryKey, { ...data, pages: data.pages.map(removePost) })
      }
      qc.setQueryData(
        QUERY_KEYS.BOOKMARKS,
        (old: InfiniteData<PaginatedResponse<{ id: number; post: Post; created_at: string }>> | undefined) =>
          old
            ? {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  results: page.results.filter((b) => b.post.id !== postId),
                })),
              }
            : old
      )
      qc.removeQueries({ queryKey: QUERY_KEYS.POST(postId) })

      return { previousFeed, previousBookmarks, allCommunityFeeds, allUserFeeds }
    },

    onError: (_err, postId, context) => {
      if (context?.previousFeed) qc.setQueryData(QUERY_KEYS.FEED, context.previousFeed)
      if (context?.previousBookmarks) qc.setQueryData(QUERY_KEYS.BOOKMARKS, context.previousBookmarks)
      for (const [key, data] of context?.allCommunityFeeds ?? []) qc.setQueryData(key as QueryKey, data)
      for (const [key, data] of context?.allUserFeeds ?? []) qc.setQueryData(key as QueryKey, data)
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FEED })
      qc.invalidateQueries({ queryKey: ['posts', 'community'] })
      qc.invalidateQueries({ queryKey: ['posts', 'user'] })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOOKMARKS })
    },
  })
}

export function useDeleteComment(postId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => postsApi.deleteComment(commentId),

    onMutate: async (commentId) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.COMMENTS(postId) })
      const previousComments = qc.getQueryData(QUERY_KEYS.COMMENTS(postId))

      qc.setQueryData(
        QUERY_KEYS.COMMENTS(postId),
        (old: InfiniteData<PaginatedResponse<Comment>> | undefined) =>
          old
            ? {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  results: page.results.filter((c) => c.id !== commentId),
                })),
              }
            : old
      )

      return { previousComments }
    },

    onError: (_err, _commentId, context) => {
      if (context?.previousComments) qc.setQueryData(QUERY_KEYS.COMMENTS(postId), context.previousComments)
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.COMMENTS(postId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POST(postId) })
    },
  })
}

export function useToggleReaction(postId: number) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (reactionType: ReactionType | null) =>
      postsApi.toggleReaction(postId, reactionType),

    onMutate: async (newReaction) => {
      // Cancel all inflight post queries to avoid overwriting our optimistic update
      await qc.cancelQueries({ queryKey: QUERY_KEYS.FEED })
      await qc.cancelQueries({ queryKey: ['posts', 'community'] })
      await qc.cancelQueries({ queryKey: QUERY_KEYS.POST(postId) })

      // Snapshot current state for rollback on error
      const previousFeed = qc.getQueryData(QUERY_KEYS.FEED)
      const previousPost = qc.getQueryData<Post>(QUERY_KEYS.POST(postId))
      const allCommunityFeeds = qc.getQueriesData<InfiniteData<PaginatedResponse<Post>>>({
        queryKey: ['posts', 'community'],
      })

      // Single post update function reused across all cache types
      const applyUpdate = (post: Post): Post => {
        if (post.id !== postId) return post
        const prevReaction = post.user_reaction
        const prevCount = post.reactions_count
        const prevSummary = { ...post.reactions_summary }

        if (prevReaction && prevSummary[prevReaction]) {
          prevSummary[prevReaction] = (prevSummary[prevReaction] ?? 1) - 1
          if (prevSummary[prevReaction] === 0) delete prevSummary[prevReaction]
        }
        if (newReaction) {
          prevSummary[newReaction] = (prevSummary[newReaction] ?? 0) + 1
        }

        const countDelta =
          prevReaction && !newReaction ? -1 : !prevReaction && newReaction ? 1 : 0

        return {
          ...post,
          user_reaction: newReaction,
          reactions_count: prevCount + countDelta,
          reactions_summary: prevSummary,
        }
      }

      // Update FEED cache
      qc.setQueryData(
        QUERY_KEYS.FEED,
        (old: InfiniteData<PaginatedResponse<Post>> | undefined) => updateInfinitePost(old, applyUpdate)
      )

      // Update every community feed currently in cache
      for (const [key, data] of allCommunityFeeds) {
        qc.setQueryData(key as QueryKey, updateInfinitePost(data, applyUpdate))
      }

      // Update single-post cache (PostDetailPage)
      if (previousPost) {
        qc.setQueryData<Post>(QUERY_KEYS.POST(postId), applyUpdate(previousPost))
      }

      return { previousFeed, previousPost, allCommunityFeeds }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousFeed) qc.setQueryData(QUERY_KEYS.FEED, context.previousFeed)
      if (context?.previousPost) qc.setQueryData(QUERY_KEYS.POST(postId), context.previousPost)
      for (const [key, data] of context?.allCommunityFeeds ?? []) {
        qc.setQueryData(key as QueryKey, data)
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FEED, refetchType: 'none' })
      qc.invalidateQueries({ queryKey: ['posts', 'community'], refetchType: 'none' })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POST(postId), refetchType: 'none' })
    },
  })
}

export function useToggleBookmark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => postsApi.toggleBookmark(postId),

    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.FEED })
      await qc.cancelQueries({ queryKey: ['posts', 'community'] })
      await qc.cancelQueries({ queryKey: QUERY_KEYS.POST(postId) })

      const prevFeed = qc.getQueryData(QUERY_KEYS.FEED)
      const prevPost = qc.getQueryData<Post>(QUERY_KEYS.POST(postId))
      const allCommunityFeeds = qc.getQueriesData<InfiniteData<PaginatedResponse<Post>>>({
        queryKey: ['posts', 'community'],
      })

      const flipBookmark = (post: Post): Post =>
        post.id === postId ? { ...post, is_bookmarked: !post.is_bookmarked } : post

      // Update FEED
      qc.setQueryData(
        QUERY_KEYS.FEED,
        (old: InfiniteData<PaginatedResponse<Post>> | undefined) => updateInfinitePost(old, flipBookmark)
      )

      // Update all community feeds
      for (const [key, data] of allCommunityFeeds) {
        qc.setQueryData(key as QueryKey, updateInfinitePost(data, flipBookmark))
      }

      // Update single post
      if (prevPost) {
        qc.setQueryData<Post>(QUERY_KEYS.POST(postId), flipBookmark(prevPost))
      }

      return { prevFeed, prevPost, allCommunityFeeds }
    },

    onError: (_err, postId, context) => {
      if (context?.prevFeed) qc.setQueryData(QUERY_KEYS.FEED, context.prevFeed)
      if (context?.prevPost) qc.setQueryData(QUERY_KEYS.POST(postId), context.prevPost)
      for (const [key, data] of context?.allCommunityFeeds ?? []) {
        qc.setQueryData(key as QueryKey, data)
      }
    },

    onSettled: (_data, _err, postId) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FEED, refetchType: 'none' })
      qc.invalidateQueries({ queryKey: ['posts', 'community'], refetchType: 'none' })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POST(postId), refetchType: 'none' })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOOKMARKS })
    },
  })
}

export function useSharePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => postsApi.sharePost(postId),
    onSuccess: (_data, postId) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FEED, refetchType: 'none' })
      qc.invalidateQueries({ queryKey: ['posts', 'community'], refetchType: 'none' })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POST(postId), refetchType: 'none' })
    },
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postsApi.addComment,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.COMMENTS(variables.post_id) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FEED, refetchType: 'none' })
    },
  })
}
