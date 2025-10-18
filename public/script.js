const fileInput = document.getElementById('fileInput')
const descargarBtn = document.getElementById('Descargarbtn')
const limpiarBtn = document.getElementById('Limpiarbtn')
const filenameEl = document.getElementById('filename')
const messageEl = document.getElementById('message') // ← este puede ser null si falta en el HTML
const pdfPreview = document.getElementById('pdfPreview')

let pdfUrl = ''
let createdObjectUrl = null
const allowedExt = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx']

function setMessage(text) {
    if (messageEl) messageEl.textContent = text
}

function resetPreview() {
    pdfPreview.style.display = 'none'
    pdfPreview.src = ''
    pdfUrl = ''
    if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl)
    createdObjectUrl = null
}

fileInput.addEventListener('change', async () => {
    setMessage('')
    const file = fileInput.files[0]
    if (!file) {
        descargarBtn.disabled = true
        filenameEl.textContent = 'Ningún archivo seleccionado'
        resetPreview()
        return
    }

    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowedExt.includes(ext)) {
        setMessage('Formato no permitido. Suba Word (.doc/.docx), PowerPoint (.ppt/.pptx) o Excel (.xls/.xlsx).')
        fileInput.value = ''
        return
    }

    filenameEl.textContent = file.name
    descargarBtn.disabled = true
    resetPreview()

    const formData = new FormData()
    formData.append('file', file)

    try {
        const res = await fetch('/api/convert', { method: 'POST', body: formData })
        if (!res.ok) {
            const txt = await res.text()
            setMessage(txt || 'Error al convertir el archivo')
            return
        }

        const blob = await res.blob()
        createdObjectUrl = URL.createObjectURL(blob)
        pdfUrl = createdObjectUrl
        pdfPreview.src = pdfUrl
        pdfPreview.style.display = 'block'
        descargarBtn.disabled = false
        setMessage('Archivo convertido correctamente. Puede previsualizarlo o descargarlo.')
    } catch (e) {
        setMessage('Error al convertir el archivo. Intente de nuevo.')
        resetPreview()
        descargarBtn.disabled = true
    }
})

descargarBtn.addEventListener('click', () => {
    if (!pdfUrl) return alert('No hay PDF para descargar')
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = fileInput.files[0].name.replace(/\.[^/.]+$/, '') + '.pdf'
    document.body.appendChild(link)
    link.click()
    link.remove()
})

limpiarBtn.addEventListener('click', () => {
    fileInput.value = ''
    filenameEl.textContent = 'Ningún archivo seleccionado'
    resetPreview()
    descargarBtn.disabled = true
    setMessage('')
})
