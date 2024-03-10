import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    // create url and connect to mongodb database
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect();
    this.db = this.client.db(database);
    this.usersCollection = this.db.collection('users');
    this.filesCollection = this.db.collection('files');
  }

  // return true if connected to mongodb
  isAlive() {
    return this.client.isConnected();
  }

  // number of users in db
  async nbUsers() {
    const userCount = await this.usersCollection.countDocuments();
    if (userCount) {
      return userCount;
    }
    return 0;
  }

  // number of files in db
  async nbFiles() {
    const fileCount = await this.filesCollection.countDocuments();

    if (fileCount) {
      return fileCount;
    }
    return 0;
  }
}

const mongoClient = new DBClient();
export default mongoClient;
