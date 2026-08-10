export default function Upload() {
  return (
    <div>
      <h1>Upload Image</h1>
      <form>
        <label>
          Title
          <input type="text" placeholder="Image title" />
        </label>
        <label>
          Image
          <input type="file" accept="image/*" />
        </label>
        <button type="submit">Upload</button>
      </form>
    </div>
  )
}
