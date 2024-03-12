import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    // connect to redis
    this.client = createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setexAsync = promisify(this.client.setex).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);

    // incase of an error
    this.client.on('error', (error) => {
      console.log(`Error connecting to redis: ${error}`);
    });

    // on connections
    this.client.on('connect', () => {
      console.log('Redis server connected');
    });
  }

  // return true if connection is arrive
  isAlive() {
    return this.client.connected;
  }

  // get value by key
  async get(key) {
    const value = await this.getAsync(key);
    return value;
  }

  // set in redis by key value and duration
  async set(key, value, duration) {
    await this.setexAsync(key, duration, value);
  }

  // del from redis using key
  async del(key) {
    await this.delAsync(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
