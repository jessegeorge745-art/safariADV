/**
 * ImageUploadField
 *
 * Lets an agent attach a trip image either by:
 *   1. Dragging and dropping a file onto the dropzone
 *   2. Clicking the dropzone to browse their device
 *   3. Pasting a direct image URL
 *
 * Whichever method is used, the component always calls onChange with a
 * single string — either a data URL (for an uploaded file) or the raw
 * URL (for the "Paste URL" tab) — so the parent form can keep treating
 * `image_url` as a plain string, no other code has to change.
 *
 * NOTE: converting the file to a base64 data URL means no backend
 * changes are required to get this working today. It's fine for a
 * student project, but a data URL is heavier than a real uploaded
 * file (it inflates the JSON payload and the DB row). See the note in
 * the chat response for how to swap this for a real multipart upload
 * to a Flask endpoint later.
 */

import { useRef, useState } from 'react'

const MAX_SIZE_MB = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export default function ImageUploadField({ value, onChange, label = 'Trip Image', height = 160 }) {
  const [mode, setMode] = useState('upload') // 'upload' | 'url'
  const [dragActive, setDragActive] = useState(false)
  const [fileError, setFileError] = useState('')
  const [fileName, setFileName] = useState('')
  const inputRef = useRef(null)

  function validateAndRead(file) {
    setFileError('')

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Please choose a JPG, PNG, WEBP, or GIF image.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`Image is too large. Max size is ${MAX_SIZE_MB}MB.`)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setFileName(file.name)
      onChange(reader.result) // base64 data URL
    }
    reader.onerror = () => setFileError('Could not read that file. Try again.')
    reader.readAsDataURL(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndRead(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  function handleBrowseClick() {
    inputRef.current?.click()
  }

  function handleFileInputChange(e) {
    const file = e.target.files?.[0]
    if (file) validateAndRead(file)
  }

  function handleRemove() {
    setFileName('')
    setFileError('')
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label>{label} (optional)</label>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, marginTop: 4 }}>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={mode === 'upload' ? 'btn-primary' : 'btn-ghost'}
          style={{ padding: '4px 12px', fontSize: '0.78rem' }}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={mode === 'url' ? 'btn-primary' : 'btn-ghost'}
          style={{ padding: '4px 12px', fontSize: '0.78rem' }}
        >
          Paste URL
        </button>
      </div>

      {mode === 'upload' ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleBrowseClick}
          className="image-dropzone"
          data-active={dragActive}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          {!value ? (
            <div style={{ textAlign: 'center', padding: '18px 12px' }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>
                {dragActive ? 'Drop image here' : 'Drag & drop an image here'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                or click to browse your device · JPG, PNG, WEBP, GIF · max {MAX_SIZE_MB}MB
              </p>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', height }}>
              <img
                src={value}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
              />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleRemove() }}
                className="image-remove-btn"
                title="Remove image"
              >
                ✕
              </button>
              {fileName && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
                  {fileName}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <input
            type="url"
            value={value?.startsWith('data:') ? '' : value}
            onChange={e => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />
          {value && !value.startsWith('data:') && (
            <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', height }}>
              <img
                src={value}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => (e.target.style.display = 'none')}
              />
            </div>
          )}
        </>
      )}

      {fileError && <p className="msg-error">{fileError}</p>}
    </div>
  )
}
