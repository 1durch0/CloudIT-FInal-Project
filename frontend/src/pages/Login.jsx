export default function Login() {
  return (
    <div>
      <h1>Login</h1>
      <form>
        <label>
          Email
          <input type="email" placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input type="password" placeholder="••••••••" />
        </label>
        <button type="submit">Sign in</button>
      </form>
    </div>
  )
}
