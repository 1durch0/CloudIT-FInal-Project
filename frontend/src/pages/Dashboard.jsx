import { useEffect, useState } from "react"
import { fetchImages, fetchStats } from "../api"

export default function Dashboard() {
  const [images, setImages] = useState([])
  const [imageCount, setImageCount] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchImages()
      .then(setImages)
      .catch((err) => setError(err.message))
    fetchStats()
      .then((data) => setImageCount(data.imageCount))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1>Dashboard</h1>
      {loading && <p>Loading images...</p>}
      {error && <p className="error">{error}</p>}
      {imageCount !== null && (
        <p className="stats">
          Serverless stats: {imageCount} image{imageCount === 1 ? "" : "s"} stored
        </p>
      )}
      <div className="gallery">
        {images.map((img) => (
          <figure key={img._id}>
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
