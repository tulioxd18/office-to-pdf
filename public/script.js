const fileInput = document.getElementById('fileInput')
const descargarBtn = document.getElementById('Descargarbtn')
const limpiarBtn = document.getElementById('Limpiarbtn')
const filenameEl = document.getElementById('filename')
const pdfPreview = document.getElementById('pdfPreview')

let pdfUrl = ''
let createdObjectUrl = null

function getFilenameFromDisposition(disposition) {
    if (!disposition) return ''
    const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/)
    return match ? decodeURIComponent(match[1]) : ''
}

fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0]
    if (!file) {
        descargarBtn.disabled = true
        filenameEl.textContent = 'Ningún archivo seleccionado'
        pdfPreview.style.display = 'none'
        pdfPreview.src = ''
        pdfUrl = ''
        if (createdObjectUrl) {
            URL.revokeObjectURL(createdObjectUrl)
            createdObjectUrl = null
        }
        return
    }
    filenameEl.textContent = file.name
    descargarBtn.disabled = true
    pdfPreview.style.display = 'none'
    pdfPreview.src = ''
    pdfUrl = ''
    if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl)
        createdObjectUrl = null
    }
    const formData = new FormData()
    formData.append('file', file)
    try {
        const res = await fetch('/api/convert', { method: 'POST', body: formData })
        if (!res.ok) {
            const txt = await res.text()
            alert(txt || 'Error al convertir el archivo')
            return
        }
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
            const data = await res.json()
            if (!data || !data.url) {
                alert('Respuesta inválida del servidor')
                return
            }
            pdfUrl = data.url
            pdfPreview.src = pdfUrl
            pdfPreview.style.display = 'block'
            descargarBtn.disabled = false
        } else if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
            const blob = await res.blob()
            createdObjectUrl = URL.createObjectURL(blob)
            pdfUrl = createdObjectUrl
            const dispo = res.headers.get('content-disposition') || ''
            const name = getFilenameFromDisposition(dispo) || file.name.replace(/\.[^/.]+$/, '') + '.pdf'
            descargarBtn.dataset.filename = name
            pdfPreview.src = pdfUrl
            pdfPreview.style.display = 'block'
            descargarBtn.disabled = false
        } else {
            const txt = await res.text()
            alert(txt || 'Tipo de respuesta desconocido')
        }
    } catch (e) {
        alert('Error al convertir el archivo')
        if (createdObjectUrl) {
            URL.revokeObjectURL(createdObjectUrl)
            createdObjectUrl = null
        }
        pdfUrl = ''
        pdfPreview.style.display = 'none'
        pdfPreview.src = ''
        descargarBtn.disabled = true
    }
})

descargarBtn.addEventListener('click', () => {
    if (!pdfUrl) return alert('No hay PDF para descargar')
    const link = document.createElement('a')
    link.href = pdfUrl
    const name = descargarBtn.dataset.filename || ''
    if (name) link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
})

limpiarBtn.addEventListener('click', () => {
    fileInput.value = ''
    filenameEl.textContent = 'Ningún archivo seleccionado'
    pdfPreview.src = ''
    pdfPreview.style.display = 'none'
    descargarBtn.disabled = true
    pdfUrl = ''
    if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl)
        createdObjectUrl = null
    }
})
