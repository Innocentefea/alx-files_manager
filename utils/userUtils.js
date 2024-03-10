import redisClient from './redis';
import dbClient from './db';

const userUtils = {
  // return object with id and key
  async getKeyAndUserId(request) {
    const obj = { userId: null, key: null };

    const tokenHeader = request.header('X-Token');

    if (!tokenHeader) return obj;

    obj.key = `auth_${tokenHeader}`;

    obj.userId = await redisClient.get(obj.key);

    return obj;
  },

  // return user
  async getUser(quer) {
    const user = await dbClient.usersCollection.findOne(quer);
    return user;
  },
};

export default userUtils;
