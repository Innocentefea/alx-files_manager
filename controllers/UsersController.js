import mongoClient from '../utils/db';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';

class UsersController {
  // method to create new user
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const user = await mongoClient.usersCollection.findOne({ email });

    if (user) return res.status(400).json({ error: 'Already exist' });

    const sha1Pwd = sha1(password)

    try {
        const newUser = await mongoClient.usersCollection.insertOne({ email, password: sha1Pwd});
        return res.status(200).json({ id: newUser.insertedId, email: email }); 
    } catch(error) {
        return res.status(400).json({ error: error.message || error.toString() }); 
    }
    
  }

  // get user token by token
  static async getMe(req, res) {
    const tokenHeader = req.headers['x-token'];

    const key = `auth_${tokenHeader}`;

    const userId = await redisClient.get(key);

    const user = await mongoClient.usersCollection.findOne({ _id: ObjectId(userId) });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    return res.status(200).json({ email: user.email, id: user._id });
  }
}

export default UsersController;
