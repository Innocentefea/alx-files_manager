import Queue from 'bull';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import imageThumbnail from 'image-thumbnail';
import mongoClient from './utils/db';

const fileQueue = new Queue('image thumbnail generation');
const userQueue = new Queue('Add user to queue');

fileQueue.process(async (job) => {
  try {
    const { userId, fileId } = job.data;

    if (!userId) throw new Error('Missing userId');
    if (!fileId) throw new Error('Missing fileId');

    const file = await mongoClient.filesCollection.findOne({
      userId: ObjectId(userId),
      _id: ObjectId(fileId),
    });

    if (!file) throw new Error('File not found');

    const sizes = [500, 250, 100];
    await Promise.all(sizes.map(async (size) => {
      try {
        const thumbnail = await imageThumbnail(file.localPath, { width: size });
        await fs.promises.writeFile(`${file.localPath}_${size}`, thumbnail);
      } catch (err) {
        console.log(`Error generating ${size} thumbnail: `, err.message || err.toString());
      }
    }));
  } catch (error) {
    console.log('Error: ', error.message || error.toString());
  }
});

userQueue.process(async (job) => {
  try {
    const { userId } = job.data;
    if (!userId) throw new Error('Missing userId');

    const user = await mongoClient.usersCollection.findOne({ _id: ObjectId(userId) });

    console.log(`Welcome ${user.email}!`);
  } catch (error) {
    console.log('Error: ', error.message || error.toString());
  }
});
