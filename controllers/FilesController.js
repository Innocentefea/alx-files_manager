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

    if (!file) return res.status(404).json({ error: 'Not found' });

    const fileJson = { id: file._id, ...file, _id: undefined };
    return res.json(fileJson);
  }

  static async getIndex(req, res) {
    const tokenHeader = req.header('X-Token');

    if (!tokenHeader) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${tokenHeader}`);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await mongoClient.usersCollection.findOne({ _id: ObjectId(userId) });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const parentId = req.query.parentId ? ObjectId(req.query.parentId) : '0';

    const count = await mongoClient.filesCollection.countDocuments({
      userId: ObjectId(userId),
      parentId,
    });

    if (count === '0') return res.json([]);

    const skip = (parseInt(req.query.page, 10) || 0) * 20;
    console.log(skip);

    const files = await mongoClient.filesCollection.aggregate([
      { $match: { userId: ObjectId(userId), parentId } },
      { $skip: skip },
      { $limit: 20 },

    ]).toArray();

    const filesJson = files.map((file) => ({
      id: file._id,
      ...file,
      _id: undefined,
    }));

    return res.json(filesJson);
  }
}

export default FilesController;
