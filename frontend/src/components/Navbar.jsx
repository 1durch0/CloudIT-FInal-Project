import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <span className="brand">My Gallery</span>
      <NavLink to="/">Home</NavLink>
      <NavLink to="/login">Login</NavLink>
      <NavLink to="/register">Register</NavLink>
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/upload">Upload</NavLink>
      <NavLink to="/about">About</NavLink>
    </nav>
  )
}
