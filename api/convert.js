const formidable = require('formidable')
const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const fetch = require('node-fetch')

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')

    const form = new formidable.IncomingForm()
    form.parse(req, async (err, fields, files) => {
        if (err || !files.file) return res.status(400).send('No file uploaded')

        const file = files.file
        const ext = path.extname(file.originalFilename || file.name || '').toLowerCase()
        if (!['.docx', '.pptx', '.xlsx'].includes(ext)) return res.status(400).send('Solo se permiten archivos Word, PowerPoint o Excel')

        const apiKey = process.env.CLOUDMERSIVE_API_KEY
        if (!apiKey) return res.status(500).send('Falta CLOUDMERSIVE_API_KEY')

        let url = 'https://api.cloudmersive.com/convert/docx/to/pdf'
        if (ext === '.pptx') url = 'https://api.cloudmersive.com/convert/pptx/to/pdf'
        if (ext === '.xlsx') url = 'https://api.cloudmersive.com/convert/xlsx/to/pdf'

        try {
            const formData = new FormData()
            formData.append('file', fs.createReadStream(file.filepath), { filename: file.originalFilename || file.name })
            const headers = Object.assign({ Apikey: apiKey }, formData.getHeaders())
            const resp = await fetch(url, { method: 'POST', headers, body: formData })

            if (!resp.ok) {
                const txt = await resp.text().catch(() => '')
                return res.status(resp.status).send(txt || 'Error en Cloudmersive')
            }

            const contentType = resp.headers.get('content-type') || 'application/pdf'
            const safeBase = path.basename(file.originalFilename || file.name || 'document', ext).replace(/[^a-zA-Z0-9_\-]/g, '_')
            const pdfName = `${safeBase}.pdf`
            res.setHeader('Content-Type', contentType)
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(pdfName)}`)
            resp.body.pipe(res)
        } catch (e) {
            res.status(500).send('Error interno')
        }
    })
}
