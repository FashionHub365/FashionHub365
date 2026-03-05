const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const bufferToStream = (buffer) => {
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    return readable;
};

const uploadImage = (file, folder = 'uploads') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                transformation: [{ quality: 'auto', fetch_format: 'auto' }],
            },
            (error, result) => {
                if (error) {
                    return reject(new Error(error.message));
                }
                return resolve(result);
            }
        );

        bufferToStream(file.buffer).pipe(uploadStream);
    });
};

const formatUploadResult = (result) => ({
    publicId: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    size: result.bytes,
});

module.exports = {
    uploadImage,
    formatUploadResult,
};
