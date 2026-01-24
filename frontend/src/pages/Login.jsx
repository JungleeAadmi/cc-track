import api from "../services/api";

export default function Login() {
  const login = async () => {
    const r = await api.post("/auth/login", null, {
      params: { username: "demo", password: "demo" },
    });
    localStorage.setItem("token", r.data.access_token);
    location.href = "/dashboard";
  };

  return <button onClick={login}>Login</button>;
}
