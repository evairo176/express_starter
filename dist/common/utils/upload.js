"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadUrlToCloudinary = exports.uploadBufferToCloudinary = void 0;
const stream_1 = require("stream");
const cloudinary_1 = __importDefault(require("./cloudinary"));
const uploadBufferToCloudinary = (buffer, folder = 'portfolio', options = {}) => new Promise((resolve, reject) => {
    const uploadStream = cloudinary_1.default.uploader.upload_stream(Object.assign({ folder, resource_type: 'image' }, options), (error, result) => {
        if (result)
            resolve(result);
        else
            reject(error);
    });
    // Convert Buffer → Readable Stream
    stream_1.Readable.from(buffer).pipe(uploadStream);
});
exports.uploadBufferToCloudinary = uploadBufferToCloudinary;
const uploadUrlToCloudinary = (imageUrl, folder = 'portfolio', options = {}) => cloudinary_1.default.uploader.upload(imageUrl, Object.assign({ folder, resource_type: 'image' }, options));
exports.uploadUrlToCloudinary = uploadUrlToCloudinary;
