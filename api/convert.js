import formidable from 'formidable';
import fs from 'fs';
import CloudmersiveConvertApiClient from 'cloudmersive-convert-api-client';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    if (!process.env.CLOUDMERSIVE_API_KEY) return res.status(500).send('Falta CLOUDMERSIVE_API_KEY');

    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err || !files.file) return res.status(400).send('No file uploaded');

        const file = files.file;
        const ext = file.originalFilename.split('.').pop().toLowerCase();

        const allowedExt = ['docx', 'pptx', 'xlsx'];
        if (!allowedExt.includes(ext)) return res.status(400).send('Solo se permiten archivos Word, PowerPoint o Excel');

        const defaultClient = CloudmersiveConvertApiClient.ApiClient.instance;
        defaultClient.authentications['Apikey'].apiKey = process.env.CLOUDMERSIVE_API_KEY;
        const api = new CloudmersiveConvertApiClient.ConvertDocumentApi();
        const inputFile = fs.readFileSync(file.filepath);

        try {
            let pdfBuffer;
            if (ext === 'docx') {
                pdfBuffer = await new Promise((resolve, reject) => {
                    api.convertDocumentDocxToPdf(inputFile, (error, data) => {
                        if (error) reject(error);
                        else resolve(Buffer.from(data, 'base64'));
                    });
                });
            } else if (ext === 'pptx') {
                pdfBuffer = await new Promise((resolve, reject) => {
                    api.convertDocumentPptxToPdf(inputFile, (error, data) => {
                        if (error) reject(error);
                        else resolve(Buffer.from(data, 'base64'));
                    });
                });
            } else if (ext === 'xlsx') {
                pdfBuffer = await new Promise((resolve, reject) => {
                    api.convertDocumentXlsxToPdf(inputFile, (error, data) => {
                        if (error) reject(error);
                        else resolve(Buffer.from(data, 'base64'));
                    });
                });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${file.originalFilename.replace(/\.[^.]+$/, '.pdf')}"`);
            res.send(pdfBuffer);
        } catch (e) {
            console.error(e);
            res.status(500).send('Error al convertir el archivo');
        }
    });
}
