import { useRef, useState } from 'react'
import './image-to-pdf.css'

const icons = {
  image: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/></>,
  trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  arrow: <><path d="m9 18 6-6-6-6"/></>,
  grip: <><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></>,
}
function Icon({ name, size = 18 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg> }
function formatSize(bytes) { return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB` }

function App() {
  const [pages, setPages] = useState([])
  const [dragging, setDragging] = useState(false)
  const [format, setFormat] = useState('A4')
  const [orientation, setOrientation] = useState('Portrait')
  const [margin, setMargin] = useState('Small')
  const [filename, setFilename] = useState('my-images')
  const [status, setStatus] = useState('')
  const inputRef = useRef(null)
  const addFiles = (files) => {
    const accepted = [...files].filter((file) => file.type.startsWith('image/'))
    if (!accepted.length) { setStatus('Choose image files such as JPG, PNG, or WEBP.'); return }
    setStatus('')
    setPages((current) => [...current, ...accepted.map((file) => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, url: URL.createObjectURL(file) }))])
  }
  const removePage = (id) => setPages((current) => { const removed = current.find((page) => page.id === id); if (removed) URL.revokeObjectURL(removed.url); return current.filter((page) => page.id !== id) })
  const movePage = (index, direction) => setPages((current) => { const next = [...current]; const target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next })
  const convert = async () => {
    if (!pages.length) return
    setStatus('Preparing your PDF…')
    try {
      const { jsPDF } = await import('jspdf')
      const dimensions = { A4: [210, 297], Letter: [215.9, 279.4], Fit: null }
      const padding = { None: 0, Small: 10, Large: 20 }[margin]
      let doc
      for (const page of pages) {
        const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(page.file) })
        const image = new Image(); image.src = data
        await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject })
        const ratio = image.naturalWidth / image.naturalHeight
        let [w, h] = dimensions[format] || [image.naturalWidth * 0.264583, image.naturalHeight * 0.264583]
        if (format !== 'Fit' && orientation === 'Landscape') [w, h] = [h, w]
        if (format === 'Fit' && orientation === 'Landscape' && h > w) [w, h] = [h, w]
        const pageOrientation = w > h ? 'landscape' : 'portrait'
        if (!doc) doc = new jsPDF({ orientation: pageOrientation, unit: 'mm', format: [w, h], compress: true })
        else doc.addPage([w, h], pageOrientation)
        const innerW = w - padding * 2; const innerH = h - padding * 2
        let drawW = innerW; let drawH = drawW / ratio
        if (drawH > innerH) { drawH = innerH; drawW = drawH * ratio }
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
        canvas.getContext('2d').drawImage(image, 0, 0)
        const imageFormat = page.file.type === 'image/png' ? 'PNG' : 'JPEG'
        const pdfImage = canvas.toDataURL(imageFormat === 'PNG' ? 'image/png' : 'image/jpeg', 0.92)
        doc.addImage(pdfImage, imageFormat, (w - drawW) / 2, (h - drawH) / 2, drawW, drawH, undefined, 'FAST')
      }
      doc.save(`${filename.trim() || 'my-images'}.pdf`)
      setStatus('Your PDF is ready and downloading.')
    } catch { setStatus('Something went wrong while creating the PDF. Try another image.') }
  }
  const clearAll = () => { pages.forEach((page) => URL.revokeObjectURL(page.url)); setPages([]); setStatus('') }
  return (
    <div className="app-shell">
      <header className="topbar"><a className="brand" href="#top" aria-label="Paperform home"><span className="brand-mark"><Icon name="file" size={19}/></span><span>paper<span className="brand-accent">form</span></span></a><nav><a href="#how-it-works">How it works</a><a href="#workspace">Convert images</a></nav><span className="privacy-pill"><span/> 100% private</span></header>
      <main id="top">
        <section className="hero"><div className="eyebrow"><span className="eyebrow-dot"/> YOUR IMAGES, ONE BEAUTIFUL PDF</div><h1>Pictures in.<br/><span>PDF out.</span></h1><p className="hero-copy">Turn your photos into a polished PDF in seconds.<br className="desktop-break"/> Simple, secure, and completely free.</p><div className="hero-assurances"><span><b>✓</b> No sign-up required</span><i/><span><b>✓</b> Files stay on your device</span></div></section>
        <section id="workspace" className="workspace">
          <div className="workspace-head"><div><div className="section-kicker">YOUR WORKSPACE</div><h2>Build your PDF</h2></div><div className="step-indicator"><span>01</span><i/> <span className={pages.length ? 'step-active' : ''}>02</span><i/> <span className={pages.length ? 'step-active' : ''}>03</span></div></div>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(event) => { addFiles(event.target.files); event.target.value = '' }} />
          {pages.length === 0 ? (
            <div className={`dropzone ${dragging ? 'dropzone-active' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files) }}
              onClick={() => inputRef.current?.click()} role="button" tabIndex={0}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click() }}>
              <div className="upload-art"><div className="upload-back"/><div className="upload-front"><Icon name="image" size={25}/></div><span className="upload-plus"><Icon name="plus" size={13}/></span></div>
              <h3>Drop your images here</h3><p>or <button className="browse-link" type="button" onClick={(event) => { event.stopPropagation(); inputRef.current?.click() }}>browse files</button> from your device</p>
              <div className="file-types"><span>JPG</span><span>PNG</span><span>WEBP</span><span>GIF</span><i/> UP TO 50 MB EACH</div>
            </div>
          ) : (
            <div className="editor">
              <div className="editor-toolbar"><div className="image-count"><span className="count-icon"><Icon name="image" size={16}/></span><div><strong>{pages.length} {pages.length === 1 ? 'image' : 'images'}</strong><small>Drag to reorder your pages</small></div></div><div className="toolbar-actions"><button className="text-button" onClick={() => inputRef.current?.click()}><Icon name="plus" size={15}/> Add images</button><button className="text-button muted" onClick={clearAll}><Icon name="trash" size={15}/> Clear all</button></div></div>
              <div className="page-grid">{pages.map((page, index) => <article className="page-card" key={page.id} draggable onDragStart={(event) => { event.dataTransfer.setData('text/plain', String(index)); event.dataTransfer.effectAllowed = 'move' }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData('text/plain')); if (from === index) return; setPages((current) => { const next = [...current]; const [picked] = next.splice(from, 1); next.splice(index, 0, picked); return next }) }}><div className="thumb-wrap"><img src={page.url} alt={`Page ${index + 1}: ${page.file.name}`}/><span className="page-number">{String(index + 1).padStart(2, '0')}</span><div className="page-controls"><button aria-label="Move page up" disabled={!index} onClick={() => movePage(index, -1)}>↑</button><button aria-label="Move page down" disabled={index === pages.length - 1} onClick={() => movePage(index, 1)}>↓</button><button aria-label={`Remove ${page.file.name}`} onClick={() => removePage(page.id)}><Icon name="trash" size={14}/></button></div></div><div className="page-meta"><span title={page.file.name}>{page.file.name}</span><small>{formatSize(page.file.size)}</small></div></article>)}<button className="add-card" onClick={() => inputRef.current?.click()}><span><Icon name="plus" size={20}/></span><strong>Add another</strong><small>Choose image files</small></button></div>
            </div>
          )}
          <div className="settings"><div className="settings-label"><span className="settings-icon"><Icon name="file" size={17}/></span><div><strong>Page settings</strong><small>Make it look just right</small></div></div><label className="setting-control"><span>PAGE SIZE</span><select value={format} onChange={(event) => setFormat(event.target.value)}><option>A4</option><option>Letter</option><option>Fit</option></select></label><label className="setting-control"><span>ORIENTATION</span><select value={orientation} onChange={(event) => setOrientation(event.target.value)}><option>Portrait</option><option>Landscape</option></select></label><label className="setting-control"><span>MARGINS</span><select value={margin} onChange={(event) => setMargin(event.target.value)}><option>None</option><option>Small</option><option>Large</option></select></label></div>
          <div className="convert-row"><label className="filename-field"><span>FILE NAME</span><div><input value={filename} onChange={(event) => setFilename(event.target.value)} aria-label="PDF filename"/><b>.pdf</b></div></label><button className="convert-button" onClick={convert} disabled={!pages.length}><Icon name="download" size={17}/> Convert to PDF <Icon name="arrow" size={17}/></button></div>{status && <p className="status-message" role="status">{status}</p>}
          <div className="secure-note"><span>✦</span> Your images are processed in your browser and never uploaded.</div>
        </section>
        <section id="how-it-works" className="how-section"><div className="section-kicker">THREE LITTLE STEPS</div><h2>From photos to PDF,<br/>just like that.</h2><div className="steps"><article><span className="step-num">01</span><div className="step-icon"><Icon name="upload" size={20}/></div><h3>Add your images</h3><p>Drop in your JPG, PNG, WEBP, or HEIC files. Add as many as you need.</p></article><article><span className="step-num">02</span><div className="step-icon"><Icon name="grip" size={20}/></div><h3>Arrange & customize</h3><p>Put pages in the right order, then pick the size, orientation, and margins.</p></article><article><span className="step-num">03</span><div className="step-icon"><Icon name="download" size={20}/></div><h3>Download your PDF</h3><p>One click and your neatly packaged PDF is ready to share or save.</p></article></div></section>
        <section className="privacy-banner"><span className="privacy-shield">✓</span><div><strong>Private by design.</strong><p>Your images never leave your device. Conversion happens right here in your browser.</p></div><span className="privacy-stamp">NO UPLOADS<br/>EVER</span></section>
      </main><footer><a className="brand footer-brand" href="#top"><span className="brand-mark"><Icon name="file" size={16}/></span><span>paper<span className="brand-accent">form</span></span></a><span>Made for the moments worth keeping.</span><span>Free forever <b>✳</b></span></footer>
    </div>
  )
}

export default App


