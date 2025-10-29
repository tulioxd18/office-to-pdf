document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const descargarBtn = document.getElementById('Descargarbtn');
    const limpiarBtn = document.getElementById('Limpiarbtn');
    const filenameEl = document.getElementById('filename');
    const messageEl = document.getElementById('message');
    const pdfPreview = document.getElementById('pdfPreview');
    let pdfUrl = '';

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) {
            descargarBtn.disabled = true;
            filenameEl.textContent = 'Ningún archivo seleccionado';
            pdfPreview.style.display = 'none';
            pdfPreview.src = '';
            pdfUrl = '';
            return;
        }

        const ext = file.name.split('.').pop().toLowerCase();
        if (!['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
            alert('Solo se permiten archivos Word, PowerPoint o Excel');
            fileInput.value = '';
            return;
        }

        filenameEl.textContent = file.name;
        descargarBtn.disabled = true;
        pdfPreview.style.display = 'none';
        pdfPreview.src = '';
        pdfUrl = '';

        try {
            messageEl.textContent = 'Convirtiendo archivo...';
            const arrayBuffer = await file.arrayBuffer();

            const res = await fetch('/api/convert', {
                method: 'POST',
                headers: { 'X-Filename': file.name },
                body: arrayBuffer
            });

            if (res.status === 405) {
                alert('Método no permitido. Asegúrate de no acceder a la URL directamente en el navegador.');
                messageEl.textContent = '';
                return;
            }

            if (!res.ok) {
                const txt = await res.text();
                alert(txt || 'Error al convertir el archivo');
                messageEl.textContent = '';
                return;
            }

            const blob = await res.blob();
            pdfUrl = URL.createObjectURL(blob);
            pdfPreview.src = pdfUrl;
            pdfPreview.style.display = 'block';
            descargarBtn.disabled = false;
            messageEl.textContent = 'Archivo listo';
        } catch (e) {
            console.error(e);
            alert('Error al convertir el archivo');
            messageEl.textContent = '';
        }
    });

    descargarBtn.addEventListener('click', () => {
        if (!pdfUrl) return alert('No hay PDF para descargar');
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = filenameEl.textContent.replace(/\.[^.]+$/, '.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
    });

    limpiarBtn.addEventListener('click', () => {
        fileInput.value = '';
        filenameEl.textContent = 'Ningún archivo seleccionado';
        messageEl.textContent = '';
        pdfPreview.src = '';
        pdfPreview.style.display = 'none';
        descargarBtn.disabled = true;
        pdfUrl = '';
    });
});
