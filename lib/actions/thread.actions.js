"use server";

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

export async function createThread({ text, author, communityId, path }) {
  try {
    connectToDB();

    const createdThread = await Thread.create({
      text,
      author,
      community: null,
    });

    //Update each Users Model
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    revalidatePath(path); //Revalidate the path where this is called so the changes immediately appears
  } catch (error) {
    throw new Error(error);
  }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  connectToDB();

  //Calculate the number of posts to skip
  const skipAmount = (pageNumber - 1) * pageSize;

  //Fetch post that have no parents
  const postsQ = Thread.find({ parentId: { $in: [null, undefined] } })
    .sort({
      createdAt: "desc",
    })
    .skip()
    .limit(pageSize)
    .populate({ path: "author", model: User })
    .populate({
      path: "children",
      populate: {
        path: "author",
        model: User,
        select: "_id name parentId image",
      },
    });

  const totalPostsCount = await Thread.countDocuments({
    parentId: { $in: [null, undefined] },
  });

  const posts = await postsQ.exec();

  const isNextPage = totalPostsCount > skipAmount + posts.length;

  return { posts, isNextPage };
}

export async function fetchThreadById(id) {
  connectToDB();

  try {
    const thread = await Thread.findById(id)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "children",
        populate: [
          { path: "author", model: User, select: "_id id name parentId image" },
          {
            path: "children",
            model: Thread,
            select: "_id id name parentId image",
          },
        ],
      })
      .exec();

    return thread;
  } catch (error) {
    throw new Error("Error fetching thread: ", error);
  }
}

export async function addCommentToThread(threadId, commentText, userId, path) {
  connectToDB();

  try {
    const originalThread = await Thread.findById(threadId);

    if (!originalThread) {
      throw new Error("Thread Not Found");
    }

    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId,
    });

    const savedCommentThread = await commentThread.save();

    originalThread.children.push(savedCommentThread._id);

    await originalThread.save();

    revalidatePath(path);
  } catch (error) {
    throw new Error("Error adding comment to thread", error);
  }
}
