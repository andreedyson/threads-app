import React from "react";
import ThreadCard from "../cards/ThreadCard";
import { fetchCommunityPosts } from "@/lib/actions/community.actions";
import { fetchUserPosts } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";

const ThreadsTab = async ({ currentUserId, accountId, accountType }) => {
  let res;

  if (accountType === "Community") {
    res = await fetchCommunityPosts(accountId);
  } else {
    res = await fetchUserPosts(accountId);
  }

  if (!res) redirect("/");

  return (
    <section className="flex flex-col gap-10 mt-9">
      {res.threads.map((thread) => (
        <ThreadCard
          key={thread._id}
          id={thread._id}
          currentUserId={currentUserId}
          parentId={thread.parentId}
          content={thread.text}
          author={
            accountType === "User"
              ? { name: res.name, image: res.image, id: res.id }
              : {
                  name: thread.author.name,
                  image: thread.author.image,
                  id: thread.author.id,
                }
          }
          community={
            accountType === "Community"
              ? { name: res.name, id: res.id, image: res.image }
              : thread.community
          }
          createdAt={thread.createdAt}
          comments={thread.children}
        />
      ))}
    </section>
  );
};

export default ThreadsTab;
