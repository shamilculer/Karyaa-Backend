import { S3Client, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * Moves an object in S3 from sourceKey to destinationKey
 * @param {string} sourceKey 
 * @param {string} destinationKey 
 * @returns {Promise<string>} The new public URL
 */
export const moveS3Object = async (sourceKey, destinationKey) => {
    const bucketName = process.env.AWS_BUCKET_NAME;

    try {
        // 1. Copy Object
        await s3Client.send(new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${sourceKey}`,
            Key: destinationKey,
            // ACL: 'public-read' // Uncomment if you need public read access and bucket allows it
        }));

        // 2. Delete Original Object
        await s3Client.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: sourceKey,
        }));

        // Return the new public URL
        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${destinationKey}`;

    } catch (error) {
        console.error("Error moving S3 object:", error);
        throw error;
    }
};

/**
 * Extracts the S3 key from a full URL
 * @param {string} url 
 * @returns {string|null}
 */
export const getKeyFromUrl = (url) => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        // Remove leading slash
        return urlObj.pathname.substring(1);
    } catch (e) {
        // Fallback if it's just a path string
        return url;
    }
};

/**
 * Checks if an S3 object exists
 * @param {string} key 
 * @returns {Promise<boolean>}
 */
export const checkS3ObjectExists = async (key) => {
    const bucketName = process.env.AWS_BUCKET_NAME;

    try {
        await s3Client.send(new HeadObjectCommand({
            Bucket: bucketName,
            Key: key,
        }));
        return true;
    } catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        // For other errors, throw them
        throw error;
    }
};

/**
 * Deletes an object from S3
 * @param {string} key 
 * @returns {Promise<void>}
 */
export const deleteS3Object = async (key) => {
    const bucketName = process.env.AWS_BUCKET_NAME;

    try {
        await s3Client.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        }));
    } catch (error) {
        console.error(`Error deleting S3 object (${key}):`, error);
        // We might not want to throw here to avoid blocking the main operation
        // but logging is essential.
    }
};
