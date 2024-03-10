import { createRedis } from 'redis';
import { promisify } from 'utils';


class RedisClient {
    constructor () {
        // connect to redis
        this.client = createRedis();
        this.getAsync = promisify(this.client.get).bind(this.client);
        this.setexAsync = promisify(this.client.setex).bind(this.client);
        this.delAsync = promisify(this.client.del).bind(this.client);

        // incase of an error
        this.client.on('error', (error) => {
            console.log(`Error connecting to redis: ${error}`);
        })

        // on connections
        this.client.on('connect', () => {
            console.log('Redis server connected');
        })
    }

    // return true if connection is arrive
    isAlive = () => {
        return this.client.connected;
    }

    get = async(key) => {
        const value = await this.getAsync(key);
        return value;
    }

    set = async(key, value, duration) => {
        await this.setexAsync(key, duration, value);
    }

    del = async(key) => {
        await this.delAsync(key);
    }
}

module.exports = new RedisClient();