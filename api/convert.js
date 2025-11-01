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

        const ext = originalFilename.split('.').pop().toLowerCase();
        if (!['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext))
            return res.status(400).send('Solo se permiten archivos Word, PowerPoint o Excel');

        console.log('Archivo recibido:', originalFilename, 'Extensión:', ext, 'Tamaño del buffer:', buffer.length);

        const client = CloudmersiveConvertApiClient.ApiClient.instance;
        client.authentications['Apikey'].apiKey = process.env.CLOUDMERSIVE_API_KEY;
        const api = new CloudmersiveConvertApiClient.ConvertDocumentApi();

        let pdfBuffer;

        // Word
        if (ext === 'docx') {
            pdfBuffer = await new Promise((resolve, reject) =>
                api.convertDocumentDocxToPdf(buffer, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')))
            );
        } else if (ext === 'doc') {
            pdfBuffer = await new Promise((resolve, reject) =>
                api.convertDocumentDocToPdf(buffer, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')))
            );
        }

        // PowerPoint
        else if (ext === 'pptx') {
            pdfBuffer = await new Promise((resolve, reject) =>
                api.convertDocumentPptxToPdf(buffer, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')))
            );
        } else if (ext === 'ppt') {
            pdfBuffer = await new Promise((resolve, reject) =>
                api.convertDocumentPptToPdf(buffer, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')))
            );
        }

        // Excel
        else if (ext === 'xlsx') {
            pdfBuffer = await new Promise((resolve, reject) =>
                api.convertDocumentXlsxToPdf(buffer, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')))
            );
        } else if (ext === 'xls') {
            pdfBuffer = await new Promise((resolve, reject) =>
                api.convertDocumentXlsToPdf(buffer, (err, data) => err ? reject(err) : resolve(Buffer.from(data, 'base64')))
            );
        }


        if (!pdfBuffer || pdfBuffer.length === 0) {
            return res.status(500).send('No se pudo generar el PDF');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${originalFilename.replace(/\.[^.]+$/, '.pdf')}"`);
        res.send(pdfBuffer);

    } catch (e) {
        console.error('Error al convertir archivo:', e);
        res.status(500).send('Error interno al convertir el archivo. Asegúrate de que el archivo sea válido y no muy pesado.');
    }
}
