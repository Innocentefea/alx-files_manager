import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import redisClient from '../utils/redis';
import mongoClient from '../utils/db';

class FilesController {
  // function for a uploading files
  static async postUpload(req, res) {
    const tokenHeader = req.header('X-Token');

    if (!tokenHeader) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${tokenHeader}`);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await mongoClient.usersCollection.findOne({ _id: ObjectId(userId) });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, type, data } = req.body;

    const parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;

    if (!name) return res.status(400).json({ error: 'Missing name' });

    if (!type || !['folder', 'file', 'image'].includes(type)) res.status(400).json({ error: 'Missing type' });

    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    if (parentId !== 0) {
      const parentFile = await mongoClient.filesCollection.findOne({ _id: ObjectId(parentId) });

      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });

      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (type === 'folder') {
      const newFolder = await mongoClient.filesCollection.insertOne({
        userId: ObjectId(userId),
        name,
        type,
        parentId: parentId !== 0 ? ObjectId(parentId) : 0,
        isPublic,
      });
      return res.status(201).json({
        id: newFolder.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const localPath = path.join(folderPath, uuidv4());

    await fs.promises.mkdir(folderPath, { recursive: true });
    await fs.promises.writeFile(localPath, Buffer.from(data, 'base64'));

    const newFile = await mongoClient.filesCollection.insertOne({
      userId: ObjectId(userId),
      name,
      type,
      parentId: parentId !== 0 ? ObjectId(parentId) : 0,
      isPublic,
      localPath,
    });

    return res.status(201).json({
      id: newFile.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }

  // show file by id
  static async getShow(req, res) {
    const tokenHeader = req.header('X-Token');

    if (!tokenHeader) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${tokenHeader}`);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await mongoClient.usersCollection.findOne({ _id: ObjectId(userId) });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const file = await mongoClient.filesCollection.findOne({
      _id: ObjectId(id),
      userId: ObjectId(userId),
    });

    if (!file) res.status(404).json({ error: 'Not found' });

    return res.json(file);
  }

  static async getIndex(req, res) {
    const tokenHeader = req.header('X-Token');

    if (!tokenHeader) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${tokenHeader}`);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await mongoClient.usersCollection.findOne({ _id: ObjectId(userId) });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const parentId = req.query.parentId && req.query.parentId !== '0' ? ObjectId(req.query.parentId) : 0;

    const filesCount = await mongoClient.filesCollection.countDocuments({
      userId: ObjectId(userId),
      parentId,
    });

    if (parseInt(filesCount, 10) === 0) return res.json([]);

    const page = req.query.page && req.query.page !== '0' ? parseInt(req.query.page, 10) : 0;

    const jump = page * 20;

    const files = await mongoClient.filesCollection.aggregate([
      { $match: { userId: ObjectId(userId), parentId } },
      { $skip: jump },
      { $limit: 20 },

    ]).toArray();

    const filesJson = files.map((file) => ({
      ...file,
      id: file._id,
      _id: undefined,
    }));

    return res.json(filesJson);
  }
}

export default FilesController;
