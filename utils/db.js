import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    // create url and connect to mongodb database
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.isConnected = false;
    this.db = null;
  }

  // connect to mongodb
  async connect() {
    await this.client.connect();
    this.isConnected = true;
    this.db = this.client.db(this.database);
    this.isConnected = this.client.isConnected();
  }

  // return true if connected to mongodb
  async isAlive() {
    await this.connect();
    const status = this.client.isConnected();
    return status;
  }

  // number of users in db
  async nbUsers() {
    await this.connect();
    const userCount = await this.db.collection('users').countDocuments();
    if (userCount) {
      return userCount;
    }
    return 0;
  }

  // number of files in db
  async nbFiles() {
    await this.connect();
    const fileCount = await this.db.collection('files').countDocuments();

    if (fileCount) {
      return fileCount;
    }
    return 0;
  }
}

module.exports = new DBClient();
