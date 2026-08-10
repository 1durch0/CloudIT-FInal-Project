export default function Register() {
  return (
    <div>
      <h1>Register</h1>
      <form>
        <label>
          Name
          <input type="text" placeholder="Your name" />
        </label>
        <label>
          Email
          <input type="email" placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input type="password" placeholder="••••••••" />
        </label>
        <button type="submit">Create account</button>
      </form>
    </div>
  )
}
