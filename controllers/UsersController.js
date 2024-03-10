import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import mongoClient from '../utils/db';
import userUtils from '../utils/userUtils';

class UsersController {
  // method to create new user
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const user = await mongoClient.usersCollection.findOne({ email });

    if (user) return res.status(400).json({ error: 'Already exist' });

    const hashedPassword = sha1(password);

    try {
      const newUser = await mongoClient.usersCollection.insertOne({ email, password: hashedPassword });
      return res.status(201).json({ id: newUser.insertedId, email });
    } catch (error) {
      return res.status(500).json({ error: error.message || error.toString() });
    }
  }

  // get user token by token
  static async getMe(req, res) {
    const { userId } = await userUtils.getKeyAndUserId(req);

    const user = await userUtils.getUser({ _id: ObjectId(userId) });

    console.log(user);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    return res.status(200).json({ email: user.email, id: user._id });
  }
}

export default UsersController;
