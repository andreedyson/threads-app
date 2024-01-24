"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";

export async function updateUser({ userId, username, name, bio, image, path }) {
  connectToDB();

  try {
    await User.findOneAndUpdate(
      { id: userId },
      { username: username.toLowerCase(), name, bio, image, onboarded: true },
      { upsert: true }
    );

    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
}

export async function fetchUser(userId) {
  try {
    connectToDB();

    return await User.findOne({ id: userId });
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}

export async function fetchUserPost(userId) {
  try {
    connectToDB();

    //Find all threads depending on userId
    const threads = await User.findOne({ id: userId }).populate({
      path: "threads",
      model: Thread,
      populate: {
        path: "children",
        model: Thread,
        populate: {
          path: "author",
          model: User,
          select: "name image id",
        },
      },
    });

    return threads;
  } catch (error) {
    throw new Error(`Failed to fetch user posts: ${error.message}`);
  }
}
export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}) {
  try {
    connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;

    const regex = new RegExp(searchString, "i");

    const q = {
      id: { $ne: userId },
    };

    if (searchString.trim() !== "") {
      q.$or = [{ username: { $regex: regex } }, { name: { $regex: regex } }];
    }

    const sortOptions = { createdAt: sortBy };

    const usersQ = User.find(q)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    const totalUsersCount = await User.countDocuments(q);

    const users = await usersQ.exec();

    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
}

export async function getActivity(userId) {
  try {
    connectToDB();

    const userThreads = await Thread.find({ author: userId });

    //Child Threads
    const childThreadsIds = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children);
    }, []);

    const replies = await Thread.find({
      _id: { $in: childThreadsIds },
      author: { $ne: userId },
    }).populate({ path: "author", model: User, select: "name image _id" });

    return replies;
  } catch (error) {
    throw new Error(`Failed to get activities: ${error.message}`);
  }
}
