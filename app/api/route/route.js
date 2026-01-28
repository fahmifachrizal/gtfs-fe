import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const numberParam = url.searchParams.get('number');
    const dirParam = url.searchParams.get('dir');
    // Resolve the path to the GeoJSON file
    const filePath = path.join(process.cwd(), 'data', 'route', `tije_${numberParam}_${dirParam}_route.geojson`);

    // Read the GeoJSON file
    const geojsonData = await readFile(filePath, 'utf-8');
    console.log('GeoJSON data successfully read from file.');

    // Return the GeoJSON content
    return new Response(geojsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error reading GeoJSON file:', error);

    // Return an error response if something goes wrong
    return new Response(JSON.stringify({ error: 'Failed to load GeoJSON data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}