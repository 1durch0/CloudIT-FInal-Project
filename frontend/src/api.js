const AUTH_API_URL = "http://localhost:3000/api";
const GALLERY_API_URL = "http://localhost:3001/api";

async function request(baseUrl, path, options) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

export function registerUser(user) {
  return request(AUTH_API_URL, "/register", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export function loginUser(credentials) {
  return request(AUTH_API_URL, "/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function fetchImages() {
  return request(GALLERY_API_URL, "/images");
}

export function uploadImage(formData) {
  return fetch(`${GALLERY_API_URL}/images`, {
    method: "POST",
    body: formData,
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Something went wrong");
    }
    return data;
  });
}
