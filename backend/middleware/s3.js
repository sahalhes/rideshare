const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require('../config/s3Conn');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const sharp = require('sharp');

const BUCKET_NAME = process.env.BUCKET_NAME;

const putImage = async (file) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = uuidv4();
    const newName = `${uniqueName}${extension}`;

    const buffer = await sharp(file.buffer)
        .resize(256, 256, { fit: "cover" })
        .composite([{
            input: Buffer.from(
                `<svg>
                    <circle cx="128" cy="128" r="128" fill="white" />
                </svg>`
            ),
            blend: "dest-in",
        }])
        .toBuffer();

    const params = {
        Bucket: BUCKET_NAME,
        Key: newName,
        Body: buffer,
        ContentType: file.mimetype
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
    return newName;
};

const getImage = async (fileName) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
    };

    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return url;
};

const deleteImage = async (fileName) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
    };

    const command = new DeleteObjectCommand(params);
    await s3.send(command);
}

module.exports = { putImage, getImage, deleteImage };