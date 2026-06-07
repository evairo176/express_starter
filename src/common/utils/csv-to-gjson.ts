import csv from 'csv-parser';
import fs from 'fs';
// Helper convert CSV → GeoJSON
export function csvToGeoJSON(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const features: any[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: any) => {
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
