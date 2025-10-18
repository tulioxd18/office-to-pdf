const express = require("express")
const fileUpload = require("express-fileupload")
const path = require("path")
const FormData = require("form-data")
const fetch = require("node-fetch")

const CLOUDMERSIVE_API_KEY = process.env.CLOUDMERSIVE_API_KEY

const app = express()
app.use(express.static("public"))
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }))

const allowedExt = [".docx", ".pptx", ".xlsx"]

app.post("/api/convert", async (req, res) => {
    if (!CLOUDMERSIVE_API_KEY) return res.status(500).send("Falta CLOUDMERSIVE_API_KEY")
    if (!req.files || !req.files.file) return res.status(400).send("No file")
    const file = req.files.file
    const ext = path.extname(file.name).toLowerCase()
    if (!allowedExt.includes(ext)) return res.status(400).send("Solo se permiten archivos Word, PowerPoint o Excel")

    try {
        const form = new FormData()
        form.append("file", file.data, { filename: file.name })
        const headers = Object.assign({ Apikey: CLOUDMERSIVE_API_KEY }, form.getHeaders())

        let url = "https://api.cloudmersive.com/convert/docx/to/pdf"
        if (ext === ".pptx") url = "https://api.cloudmersive.com/convert/pptx/to/pdf"
        if (ext === ".xlsx") url = "https://api.cloudmersive.com/convert/xlsx/to/pdf"

        const resp = await fetch(url, { method: "POST", headers, body: form })
        if (!resp.ok) {
            const txt = await resp.text()
            return res.status(resp.status).send(txt || "Error en Cloudmersive")
        }

        const contentType = resp.headers.get("content-type") || "application/pdf"
        const safeBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_\-]/g, "_")
        const pdfName = `${safeBase}.pdf`
        res.setHeader("Content-Type", contentType)
        res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(pdfName)}`)
        resp.body.pipe(res)
    } catch (err) {
        res.status(500).send("Error interno")
    }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`))
