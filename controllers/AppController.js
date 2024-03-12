import mongoClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  // static method for getting the status
  static async getStatus(req, res) {
    try {
      const redisStatus = await redisClient.isAlive();
      const mongoStatus = await mongoClient.isAlive();

      if (redisStatus && mongoStatus) {
        res.status(200).json({ redis: redisStatus, db: mongoStatus });
      } else {
        res.status(400).json({ error: 'connecting to redis or mongodb' });
      }
    } catch (error) {
      console.error('Error getting status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // static method for getting number of users and files
  static async getStats(req, res) {
    try {
      const userCount = await mongoClient.nbUsers();
      const fileCount = await mongoClient.nbFiles();
      res.status(200).json({ users: userCount, files: fileCount });
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default AppController;
