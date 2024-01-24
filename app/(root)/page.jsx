import ThreadCard from "@/components/cards/ThreadCard";
import { fetchPosts } from "@/lib/actions/thread.actions";
import { currentUser } from "@clerk/nextjs";

export default async function Home() {
  const res = await fetchPosts(1, 30);
  const user = await currentUser();

  return (
    <>
      <h1 className="text-left head-text">Home</h1>

      <section className="flex flex-col gap-10 mt-9">
        {res.posts.length === 0 ? (
          <p className="no-result">No threads found</p>
        ) : (
          <>
            {res.posts.map((post) => (
              <ThreadCard
                key={post._id}
                id={post._id}
                currentUserId={user?.id || ""}
                parentId={post.parentId}
                content={post.text}
                author={post.author}
                community={post.community}
                createdAt={post.createdAt}
                comments={post.children}
              />
            ))}
          </>
        )}
      </section>
    </>
  );
}
