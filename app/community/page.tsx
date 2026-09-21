"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CommunityUser = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

type CommunityPost = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: CommunityUser;
  _count: {
    comments: number;
    likes: number;
  };
  likedByCurrentUser: boolean;
};

type CommunityComment = {
  id: string;
  content: string;
  createdAt: string;
  user: CommunityUser;
};

type MeResponse = {
  success: boolean;
  user?: CommunityUser;
  message?: string;
};

type PostsResponse = {
  success: boolean;
  posts?: CommunityPost[];
  message?: string;
};

type CommentsResponse = {
  success: boolean;
  comments?: CommunityComment[];
  message?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const difference = now.getTime() - date.getTime();

  const minutes = Math.floor(
    difference / (1000 * 60)
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCommentTime(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function UserAvatar({
  user,
  size = "normal",
}: {
  user: CommunityUser;
  size?: "small" | "normal";
}) {
  const sizeClasses =
    size === "small"
      ? "h-9 w-9 text-[10px]"
      : "h-11 w-11 text-xs";

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        className={`${sizeClasses} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClasses} shrink-0 items-center justify-center rounded-full bg-slate-900 font-bold text-white`}
    >
      {getInitials(user.displayName)}
    </div>
  );
}

export default function CommunityPage() {
  const [currentUser, setCurrentUser] =
    useState<CommunityUser | null>(null);

  const [posts, setPosts] =
    useState<CommunityPost[]>([]);

  const [postContent, setPostContent] =
    useState("");

  const [showComposer, setShowComposer] =
    useState(false);

  const [loading, setLoading] = useState(true);

  const [creatingPost, setCreatingPost] =
    useState(false);

  const [loadingError, setLoadingError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [deletingPostId, setDeletingPostId] =
    useState<string | null>(null);

  const [likingPostId, setLikingPostId] =
    useState<string | null>(null);

  const [followingUserId, setFollowingUserId] =
    useState<string | null>(null);

  const [commentsPost, setCommentsPost] =
    useState<CommunityPost | null>(null);

  const [comments, setComments] =
    useState<CommunityComment[]>([]);

  const [commentsLoading, setCommentsLoading] =
    useState(false);

  const [commentContent, setCommentContent] =
    useState("");

  const [creatingComment, setCreatingComment] =
    useState(false);

  const [commentsError, setCommentsError] =
    useState("");

  const remainingCharacters =
    1000 - postContent.length;

  const sortedPosts = useMemo(
    () =>
      [...posts].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      ),
    [posts]
  );

  const loadCommunity = useCallback(async () => {
    setLoading(true);
    setLoadingError("");

    try {
      const [meResponse, postsResponse] =
        await Promise.all([
          fetch("/api/v1/auth/me", {
            method: "GET",
            cache: "no-store",
          }),
          fetch("/api/v1/community", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

      const meData =
        (await meResponse.json()) as MeResponse;

      const postsData =
        (await postsResponse.json()) as PostsResponse;

      if (!meResponse.ok || !meData.success || !meData.user) {
        throw new Error(
          meData.message ??
            "Unable to load your account."
        );
      }

      if (
        !postsResponse.ok ||
        !postsData.success ||
        !postsData.posts
      ) {
        throw new Error(
          postsData.message ??
            "Unable to load community posts."
        );
      }

      setCurrentUser(meData.user);
      setPosts(postsData.posts);
    } catch (error) {
      console.error(
        "Failed to load community:",
        error
      );

      setLoadingError(
        error instanceof Error
          ? error.message
          : "Unable to load the community."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  async function createPost() {
    const content = postContent.trim();

    if (!content || creatingPost) {
      return;
    }

    setCreatingPost(true);
    setActionError("");

    try {
      const response = await fetch(
        "/api/v1/community",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
          }),
        }
      );

      const data =
        (await response.json()) as {
          success: boolean;
          post?: CommunityPost;
          message?: string;
        };

      if (!response.ok || !data.success || !data.post) {
        throw new Error(
          data.message ??
            "Unable to create the post."
        );
      }

      setPosts((current) => [
        data.post!,
        ...current,
      ]);

      setPostContent("");
      setShowComposer(false);
    } catch (error) {
      console.error(
        "Failed to create post:",
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to create the post."
      );
    } finally {
      setCreatingPost(false);
    }
  }

  async function toggleLike(post: CommunityPost) {
    if (likingPostId) {
      return;
    }

    setLikingPostId(post.id);
    setActionError("");

    try {
      const response = await fetch(
        `/api/v1/community/${post.id}/like`,
        {
          method: "POST",
        }
      );

      const data =
        (await response.json()) as {
          success: boolean;
          liked?: boolean;
          likeCount?: number;
          message?: string;
        };

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ??
            "Unable to update the like."
        );
      }

      setPosts((current) =>
        current.map((item) =>
          item.id === post.id
            ? {
                ...item,
                likedByCurrentUser:
                  data.liked ?? !item.likedByCurrentUser,
                _count: {
                  ...item._count,
                  likes:
                    data.likeCount ??
                    item._count.likes +
                      (data.liked ? 1 : -1),
                },
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Failed to toggle like:",
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update the like."
      );
    } finally {
      setLikingPostId(null);
    }
  }

  async function toggleFollow(
    userId: string
  ) {
    if (!currentUser || followingUserId) {
      return;
    }

    if (userId === currentUser.id) {
      return;
    }

    setFollowingUserId(userId);
    setActionError("");

    try {
      const response = await fetch(
        "/api/v1/community/follow",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
          }),
        }
      );

      const data =
        (await response.json()) as {
          success: boolean;
          following?: boolean;
          message?: string;
        };

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ??
            "Unable to update follow status."
        );
      }

      /*
       * The feed API currently exposes post-level
       * information, while follow state is handled
       * independently. The button therefore keeps
       * a local visual state for the current session.
       */
      setPosts((current) =>
        current.map((post) =>
          post.user.id === userId
            ? {
                ...post,
                user: {
                  ...post.user,
                },
              }
            : post
        )
      );

      /*
       * Store the latest follow state on the client.
       */
      setFollowStates((current) => ({
        ...current,
        [userId]: data.following ?? !current[userId],
      }));
    } catch (error) {
      console.error(
        "Failed to toggle follow:",
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update follow status."
      );
    } finally {
      setFollowingUserId(null);
    }
  }

  async function deletePost(postId: string) {
    if (deletingPostId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this post? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeletingPostId(postId);
    setActionError("");

    try {
      const response = await fetch(
        `/api/v1/community?postId=${encodeURIComponent(
          postId
        )}`,
        {
          method: "DELETE",
        }
      );

      const data =
        (await response.json()) as {
          success: boolean;
          message?: string;
        };

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ??
            "Unable to delete the post."
        );
      }

      setPosts((current) =>
        current.filter(
          (post) => post.id !== postId
        )
      );

      if (commentsPost?.id === postId) {
        setCommentsPost(null);
      }
    } catch (error) {
      console.error(
        "Failed to delete post:",
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to delete the post."
      );
    } finally {
      setDeletingPostId(null);
    }
  }

  async function openComments(post: CommunityPost) {
    setCommentsPost(post);
    setComments([]);
    setCommentsError("");
    setCommentContent("");
    setCommentsLoading(true);

    try {
      const response = await fetch(
        `/api/v1/community/${post.id}/comments`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as CommentsResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.comments
      ) {
        throw new Error(
          data.message ??
            "Unable to load comments."
        );
      }

      setComments(data.comments);
    } catch (error) {
      console.error(
        "Failed to load comments:",
        error
      );

      setCommentsError(
        error instanceof Error
          ? error.message
          : "Unable to load comments."
      );
    } finally {
      setCommentsLoading(false);
    }
  }

  async function createComment() {
    const content = commentContent.trim();

    if (
      !commentsPost ||
      !content ||
      creatingComment
    ) {
      return;
    }

    setCreatingComment(true);
    setCommentsError("");

    try {
      const response = await fetch(
        `/api/v1/community/${commentsPost.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
          }),
        }
      );

      const data =
        (await response.json()) as {
          success: boolean;
          comment?: CommunityComment;
          message?: string;
        };

      if (
        !response.ok ||
        !data.success ||
        !data.comment
      ) {
        throw new Error(
          data.message ??
            "Unable to add comment."
        );
      }

      setComments((current) => [
        ...current,
        data.comment!,
      ]);

      setPosts((current) =>
        current.map((post) =>
          post.id === commentsPost.id
            ? {
                ...post,
                _count: {
                  ...post._count,
                  comments:
                    post._count.comments + 1,
                },
              }
            : post
        )
      );

      setCommentsPost((current) =>
        current
          ? {
              ...current,
              _count: {
                ...current._count,
                comments:
                  current._count.comments + 1,
              },
            }
          : current
      );

      setCommentContent("");
    } catch (error) {
      console.error(
        "Failed to create comment:",
        error
      );

      setCommentsError(
        error instanceof Error
          ? error.message
          : "Unable to add comment."
      );
    } finally {
      setCreatingComment(false);
    }
  }

  const [followStates, setFollowStates] =
    useState<Record<string, boolean>>({});

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900 lg:ml-64">
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Connect
          </p>

          <div className="mt-2 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Community
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Share your trading journey, discuss
                strategies, learn from others, and
                build better trading habits together.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowComposer((current) => !current)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              <span className="text-lg leading-none">
                +
              </span>
              Create Post
            </button>
          </div>
        </div>

        {/* Stats */}
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Community Posts
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "—" : posts.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Traders
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              —
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Active Today
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              —
            </p>
          </div>
        </section>

        {/* Global error */}
        {(loadingError || actionError) && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">
              {loadingError || actionError}
            </p>

            <button
              type="button"
              onClick={() => {
                setLoadingError("");
                setActionError("");
              }}
              className="text-xs font-bold text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Composer */}
        {showComposer && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              {currentUser ? (
                <UserAvatar user={currentUser} />
              ) : (
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200" />
              )}

              <div className="min-w-0 flex-1">
                <div className="mb-3">
                  <p className="text-sm font-bold text-slate-900">
                    {currentUser?.displayName ??
                      "Your account"}
                  </p>

                  <p className="text-xs text-slate-400">
                    {currentUser
                      ? `@${currentUser.username}`
                      : ""}
                  </p>
                </div>

                <textarea
                  value={postContent}
                  onChange={(event) =>
                    setPostContent(
                      event.target.value.slice(
                        0,
                        1000
                      )
                    )
                  }
                  placeholder="Share something with the community..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                />

                <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <span
                    className={`text-xs font-medium ${
                      remainingCharacters < 100
                        ? "text-amber-600"
                        : "text-slate-400"
                    }`}
                  >
                    {remainingCharacters} characters
                    remaining
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPostContent("");
                        setShowComposer(false);
                      }}
                      className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={createPost}
                      disabled={
                        !postContent.trim() ||
                        creatingPost
                      }
                      className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {creatingPost
                        ? "Publishing..."
                        : "Publish"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Feed */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Community Feed
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Latest discussions from traders.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />

                      <div className="space-y-2">
                        <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
                        <div className="h-2.5 w-20 animate-pulse rounded bg-slate-100" />
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                      <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedPosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                  💬
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900">
                  No posts yet
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Be the first trader to start a
                  discussion in the community.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowComposer(true)
                  }
                  className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Create the first post
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedPosts.map((post) => {
                  const isOwnPost =
                    currentUser?.id === post.user.id;

                  const isFollowing =
                    followStates[post.user.id] ??
                    false;

                  return (
                    <article
                      key={post.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      {/* Author */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <UserAvatar user={post.user} />

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {post.user.displayName}
                              </p>

                              <span className="text-xs text-slate-400">
                                @{post.user.username}
                              </span>
                            </div>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {formatTime(
                                post.createdAt
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {!isOwnPost && (
                            <button
                              type="button"
                              onClick={() =>
                                toggleFollow(
                                  post.user.id
                                )
                              }
                              disabled={
                                followingUserId ===
                                post.user.id
                              }
                              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                isFollowing
                                  ? "bg-slate-100 text-slate-600"
                                  : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {followingUserId ===
                              post.user.id
                                ? "..."
                                : isFollowing
                                  ? "Following"
                                  : "Follow"}
                            </button>
                          )}

                          {isOwnPost && (
                            <button
                              type="button"
                              onClick={() =>
                                deletePost(post.id)
                              }
                              disabled={
                                deletingPostId ===
                                post.id
                              }
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              {deletingPostId ===
                              post.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mt-5">
                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {post.content}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="mt-5 flex items-center gap-1 border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            toggleLike(post)
                          }
                          disabled={
                            likingPostId === post.id
                          }
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            post.likedByCurrentUser
                              ? "bg-rose-50 text-rose-600"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                          }`}
                        >
                          <span className="text-base">
                            {post.likedByCurrentUser
                              ? "♥"
                              : "♡"}
                          </span>

                          <span>
                            {post._count.likes}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openComments(post)
                          }
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                        >
                          <span className="text-base">
                            💬
                          </span>

                          <span>
                            {post._count.comments}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard
                              ?.writeText(
                                `${window.location.origin}/community#${post.id}`
                              )
                              .catch(() => {});
                          }}
                          className="ml-auto rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                          title="Copy post link"
                        >
                          ↗
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right sidebar */}
          <aside className="space-y-5">
            {/* Community guidelines */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">
                Community Guidelines
              </h3>

              <ul className="mt-4 space-y-3">
                <li className="flex gap-3 text-sm leading-5 text-slate-500">
                  <span className="mt-0.5 text-slate-900">
                    •
                  </span>
                  Share genuine trading and learning
                  experiences.
                </li>

                <li className="flex gap-3 text-sm leading-5 text-slate-500">
                  <span className="mt-0.5 text-slate-900">
                    •
                  </span>
                  Discuss ideas respectfully.
                </li>

                <li className="flex gap-3 text-sm leading-5 text-slate-500">
                  <span className="mt-0.5 text-slate-900">
                    •
                  </span>
                  Never share private account information.
                </li>

                <li className="flex gap-3 text-sm leading-5 text-slate-500">
                  <span className="mt-0.5 text-slate-900">
                    •
                  </span>
                  Remember that paper trading is simulated.
                </li>
              </ul>
            </div>

            {/* Popular topics */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">
                Popular Topics
              </h3>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Risk Management",
                  "Technical Analysis",
                  "Paper Trading",
                  "Trading Psychology",
                  "Position Sizing",
                  "Learning",
                ].map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Reminder */}
            <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                TradeCraft
              </p>

              <h3 className="mt-2 text-base font-bold">
                Learn. Trade. Reflect.
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                The goal isn't to make every trade
                profitable. It's to become a better
                decision-maker.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Comments modal */}
      {commentsPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCommentsPost(null);
            }
          }}
        >
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Comments
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  {commentsPost._count.comments}{" "}
                  {commentsPost._count.comments === 1
                    ? "comment"
                    : "comments"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCommentsPost(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {commentsLoading ? (
                <div className="space-y-5">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex gap-3"
                    >
                      <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />

                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
                        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : commentsError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {commentsError}
                </div>
              ) : comments.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                    💬
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No comments yet
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Start the discussion.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex gap-3"
                    >
                      <UserAvatar
                        user={comment.user}
                        size="small"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">
                            {
                              comment.user
                                .displayName
                            }
                          </p>

                          <span className="text-xs text-slate-400">
                            @{comment.user.username}
                          </span>

                          <span className="text-xs text-slate-300">
                            •
                          </span>

                          <span className="text-xs text-slate-400">
                            {formatCommentTime(
                              comment.createdAt
                            )}
                          </span>
                        </div>

                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment composer */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex gap-3">
                {currentUser && (
                  <UserAvatar
                    user={currentUser}
                    size="small"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <textarea
                    value={commentContent}
                    onChange={(event) =>
                      setCommentContent(
                        event.target.value.slice(
                          0,
                          500
                        )
                      )
                    }
                    placeholder="Write a comment..."
                    rows={2}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />

                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={createComment}
                      disabled={
                        !commentContent.trim() ||
                        creatingComment
                      }
                      className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {creatingComment
                        ? "Posting..."
                        : "Comment"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
