import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import mongoClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  // connect user and set token
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization');

    console.log(`Auth header: ${authHeader}`);
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const credentials = authHeader.split(' ')[1];

    const decodedCredentials = Buffer.from(credentials, 'base64').toString('utf-8');

    const [email, password] = decodedCredentials.split(':');

    const hashedPassword = sha1(password);

    try {
      const user = await mongoClient.usersCollection.findOne({ email, password: hashedPassword });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();

      const key = `auth_${token}`;

      const duration = 3600 * 24;

      await redisClient.set(key, user._id.toString(), duration);

      return res.status(200).json({ token });
    } catch (error) {
      return res.status(500).json({ error: error.message || error.toString() });
    }
  }

  // disconnect user
  static async getDisconnect(req, res) {
    const tokenHeader = req.header('X-Token');

    if (!tokenHeader) return res.status(401).json({ error: 'Unauthorized' });

    const key = `auth_${tokenHeader}`;

    const userId = await redisClient.get(key);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    redisClient.del(key);
    return res.status(204).end();
  }
}

export default AuthController;
