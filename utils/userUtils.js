import { ObjectId } from 'mongodb';
import redisClient from './redis';
import mongoClient from './db';

// get user by request
const userUtils = {
  async getUser(req) {
    const tokenHeader = req.headers['x-token'];

    const key = `auth_${tokenHeader}`;

    const userId = await redisClient.get(key);

    const user = await mongoClient.usersCollection.findOne({ _id: ObjectId(userId) });

    if (user) {
      return user;
    }
    return null;
  },

  async getUserId(req) {
    const tokenHeader = req.headers['x-token'];

    const key = `auth_${tokenHeader}`;

    const userId = await redisClient.get(key);

    return { userId, key };
  },
};

export default userUtils;
