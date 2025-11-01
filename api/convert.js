import fs from 'fs';
import path from 'path';
import CloudmersiveConvertApiClient from 'cloudmersive-convert-api-client';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método no permitido');
    if (!process.env.CLOUDMERSIVE_API_KEY) return res.status(500).send('Falta CLOUDMERSIVE_API_KEY');

    try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);

        const originalFilename = req.headers['x-filename'];
        if (!originalFilename) return res.status(400).send('No se pudo leer el archivo');

        const tempPath = path.join('/tmp', originalFilename);
        fs.writeFileSync(tempPath, buffer);

        const client = CloudmersiveConvertApiClient.ApiClient.instance;
        client.authentications['Apikey'].apiKey = process.env.CLOUDMERSIVE_API_KEY;
        const api = new CloudmersiveConvertApiClient.ConvertDocumentApi();

        const pdfBuffer = await new Promise((resolve, reject) =>
            api.convertDocumentAutodetectToPdf(tempPath, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')))
        );

        fs.unlinkSync(tempPath);

        if (!pdfBuffer || pdfBuffer.length === 0) {
            return res.status(500).send('No se pudo generar el PDF');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${originalFilename.replace(/\.[^.]+$/, '.pdf')}"`);
        res.send(pdfBuffer);

    } catch (e) {
        console.error('Error al convertir archivo:', e);
        res.status(500).send('Error interno al convertir el archivo. Intenta con otro archivo o verifica que sea válido.');
    }
}
