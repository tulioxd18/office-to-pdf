import express from 'express';
import fileUpload from 'express-fileupload';
import CloudmersiveConvertApiClient from 'cloudmersive-convert-api-client';

const app = express();
app.use(fileUpload());

export const config = { api: { bodyParser: false } };

export default app;

app.post(async (req, res) => {
    if (!process.env.CLOUDMERSIVE_API_KEY) return res.status(500).send('Falta CLOUDMERSIVE_API_KEY');

    if (!req.files || !req.files.file) return res.status(400).send('No se subió ningún archivo');

    const file = req.files.file;
    const originalFilename = file.name;
    const ext = originalFilename.split('.').pop().toLowerCase();
    if (!['docx', 'pptx', 'xlsx'].includes(ext))
        return res.status(400).send('Solo se permiten archivos Word, PowerPoint o Excel');

    const client = CloudmersiveConvertApiClient.ApiClient.instance;
    client.authentications['Apikey'].apiKey = process.env.CLOUDMERSIVE_API_KEY;
    const api = new CloudmersiveConvertApiClient.ConvertDocumentApi();

    try {
        let pdfBuffer;
        if (ext === 'docx') pdfBuffer = await new Promise((resolve, reject) => {
            api.convertDocumentDocxToPdf(file.data, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')));
        });
        else if (ext === 'pptx') pdfBuffer = await new Promise((resolve, reject) => {
            api.convertDocumentPptxToPdf(file.data, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')));
        });
        else if (ext === 'xlsx') pdfBuffer = await new Promise((resolve, reject) => {
            api.convertDocumentXlsxToPdf(file.data, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')));
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${originalFilename.replace(/\.[^.]+$/, '.pdf')}"`);
        res.send(pdfBuffer);

    } catch (e) {
        console.error(e);
        res.status(500).send('Error al convertir el archivo');
    }
});
