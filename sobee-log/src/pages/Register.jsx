import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    gender: "",
    age: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      const res = await axios.post("http://localhost:8081/api/users/register", {
        ...form,
        age: parseInt(form.age),
      });
      alert(res.data);
      navigate("/mydata");
    } catch (e) {
      alert("회원가입 실패");
    }
  };

  const inputStyle = {
    width: "100%",
    maxWidth: "300px",
    padding: "14px",
    marginBottom: "12px",
    borderRadius: "10px",
    border: "1.5px solid #20C4F4",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "20px",
      backgroundColor: "#ffffff",
    }}>
      <h1 style={{
        fontSize: "36px",
        fontWeight: "bold",
        marginBottom: "8px",
        color: "#0083CA",
        letterSpacing: "3px",
      }}>So-Bee</h1>
      <p style={{ color: "#20C4F4", fontSize: "13px", marginBottom: "40px" }}>회원가입</p>

      <input placeholder="이름" name="name" value={form.name} onChange={handleChange} style={inputStyle} />
      <input placeholder="이메일" name="email" value={form.email} onChange={handleChange} style={inputStyle} />

      <div style={{
        width: "100%",
        maxWidth: "300px",
        marginBottom: "12px",
        display: "flex",
        gap: "10px",
      }}>
        <button
          onClick={() => setForm({ ...form, gender: "m" })}
          style={{
            flex: 1, padding: "14px", borderRadius: "10px",
            border: form.gender === "m" ? "2px solid #0083CA" : "1.5px solid #20C4F4",
            backgroundColor: form.gender === "m" ? "#E8F4FD" : "white",
            fontWeight: form.gender === "m" ? "bold" : "normal",
            color: form.gender === "m" ? "#0083CA" : "#888",
            cursor: "pointer",
          }}
        >남성</button>
        <button
          onClick={() => setForm({ ...form, gender: "f" })}
          style={{
            flex: 1, padding: "14px", borderRadius: "10px",
            border: form.gender === "f" ? "2px solid #0083CA" : "1.5px solid #20C4F4",
            backgroundColor: form.gender === "f" ? "#E8F4FD" : "white",
            fontWeight: form.gender === "f" ? "bold" : "normal",
            color: form.gender === "f" ? "#0083CA" : "#888",
            cursor: "pointer",
          }}
        >여성</button>
      </div>

      <input placeholder="나이" name="age" value={form.age} onChange={handleChange} style={{ ...inputStyle, marginBottom: "24px" }} />

      <button
        onClick={handleRegister}
        style={{
          width: "100%", maxWidth: "300px", padding: "14px",
          backgroundColor: "#0083CA", color: "white",
          border: "none", borderRadius: "10px",
          fontSize: "16px", fontWeight: "bold", cursor: "pointer",
        }}
      >회원가입</button>
    </div>
  );
}

export default Register;