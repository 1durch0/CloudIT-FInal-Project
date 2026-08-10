import { useEffect, useState } from "react"
import { fetchImages } from "../api"

export default function Dashboard() {
  const [images, setImages] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchImages()
      .then(setImages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1>Dashboard</h1>
      {loading && <p>Loading images...</p>}
      {error && <p className="error">{error}</p>}
      <div className="gallery">
        {images.map((img) => (
          <figure key={img.id}>
            <img src={img.imageUrl} alt={img.title} />
            <figcaption>
              <strong>{img.title}</strong>
              <p>{img.description}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
