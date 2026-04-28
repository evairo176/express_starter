"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csvToGeoJSON = csvToGeoJSON;
const csv_parser_1 = __importDefault(require("csv-parser"));
const fs_1 = __importDefault(require("fs"));
// Helper convert CSV → GeoJSON
function csvToGeoJSON(filePath) {
    return new Promise((resolve, reject) => {
        const features = [];
        fs_1.default.createReadStream(filePath)
            .pipe((0, csv_parser_1.default)())
            .on('data', (row) => {
            // pastikan kolom CSV punya latitude & longitude
            const lat = parseFloat(row.latitude || row.lat);
            const lon = parseFloat(row.longitude || row.lng);
            if (!isNaN(lat) && !isNaN(lon)) {
                features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [lon, lat],
                    },
                    properties: row,
                });
            }
        })
            .on('end', () => {
            resolve({
                type: 'FeatureCollection',
                features,
            });
        })
            .on('error', reject);
    });
}
