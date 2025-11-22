document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const descargarBtn = document.getElementById('Descargarbtn');
  const limpiarBtn = document.getElementById('Limpiarbtn');
  const filenameEl = document.getElementById('filename');
  const messageEl = document.getElementById('message');
  const pdfPreview = document.getElementById('pdfPreview');
  let pdfUrl = '';

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) {
      descargarBtn.disabled = true;
      filenameEl.textContent = 'Ningún archivo seleccionado';
      pdfPreview.style.display = 'none';
      pdfPreview.src = '';
      pdfUrl = '';
      return;
    }


    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('El archivo es demasiado pesado. Máximo permitido: 3 MB');
      fileInput.value = '';
      filenameEl.textContent = 'Ningún archivo seleccionado';
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['doc','docx','ppt','pptx','xls','xlsx','xlsb'].includes(ext)) {
      alert('Solo se permiten Word, Excel o PowerPoint');
      fileInput.value = '';
      return;
    }

    filenameEl.textContent = file.name;
    descargarBtn.disabled = true;
    pdfPreview.style.display = 'none';
    pdfPreview.src = '';
    pdfUrl = '';
    messageEl.textContent = '';

    (async () => {
      try {
        messageEl.textContent = 'Convirtiendo archivo...';
        const fd = new FormData();
        fd.append('file', file);

        const res = await fetch('/api/convert', { method: 'POST', body: fd });

        if (!res.ok) {
          const txt = await res.text();
          alert(txt || 'Error al convertir el archivo. Revisa que sea válido.');
          messageEl.textContent = '';
          return;
        }

        const blob = await res.blob();
        pdfUrl = URL.createObjectURL(blob);
        pdfPreview.src = pdfUrl;
        pdfPreview.style.display = 'block';
        descargarBtn.disabled = false;
        messageEl.textContent = 'Archivo listo. Haz clic en "Descargar PDF" para guardar.';
      } catch (e) {
        console.error(e);
        alert('Error al convertir el archivo. Puede ser inválido o contener elementos no soportados.');
        messageEl.textContent = '';
      }
    })();
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
