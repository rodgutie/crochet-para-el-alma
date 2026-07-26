import { useRef, useState } from 'react'
import { uploadMedia, uploadImage } from '../api/client'

const IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/i

/**
 * Drop-in replacement for a URL text input wherever a file should be uploaded.
 *
 * Props:
 *   value        – current URL string (stored in parent form state)
 *   onChange     – callback(newUrl: string)
 *   folder       – R2 subfolder: "hero" | "products" | "digital" | "attachments"
 *   accept       – <input type="file"> accept attribute
 *   label        – button label when no file is set yet
 *   previewHeight – px height of the image thumbnail (default 90)
 */
export default function MediaUpload({
  value,
  onChange,
  folder = 'general',
  accept = 'image/*',
  label = 'Subir imagen',
  previewHeight = 90,
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  const isImage = value && IMAGE_EXTS.test(value)

  const isImageAccept = accept.startsWith('image')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      let url
      if (isImageAccept) {
        // Images go to the public bucket — response is { url } directly
        ;({ url } = await uploadImage(file, folder))
      } else {
        // Non-images go to the private bucket — response is { path, url }
        ;({ url } = await uploadMedia(file, folder))
      }
      onChange(url)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      // Reset so the same file can be re-selected after a remove
      e.target.value = ''
    }
  }

  return (
    <div>
      {/* Preview */}
      {value && isImage && (
        <div style={{ marginBottom: 10 }}>
          <img
            src={value}
            alt=""
            style={{ height: previewHeight, maxWidth: '100%', borderRadius: 8, objectFit: 'cover', display: 'block', border: '1px solid var(--border-soft)' }}
          />
        </div>
      )}
      {value && !isImage && (
        <div style={{ marginBottom: 8, fontSize: '0.82rem' }}>
          <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--clay-deep)', textDecoration: 'underline' }}>
            Ver archivo ↗
          </a>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-outline"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          {uploading ? 'Subiendo…' : value ? '↑ Cambiar' : `↑ ${label}`}
        </button>
        {value && !uploading && (
          <button
            type="button"
            onClick={() => { onChange(''); setUploadError('') }}
            style={{ background: 'none', border: 'none', fontSize: '0.82rem', color: 'var(--clay-deep)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            Quitar
          </button>
        )}
      </div>

      {uploadError && (
        <p style={{ color: '#b3261e', fontSize: '0.8rem', marginTop: 6 }}>{uploadError}</p>
      )}
    </div>
  )
}
