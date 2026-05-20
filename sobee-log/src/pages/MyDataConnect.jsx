import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BANKS = [
  { code: "0002", name: "산업은행" },
  { code: "0003", name: "기업은행" },
  { code: "0004", name: "국민은행" },
  { code: "0007", name: "수협은행" },
  { code: "0011", name: "농협은행" },
  { code: "0020", name: "우리은행" },
  { code: "0023", name: "SC은행" },
  { code: "0027", name: "씨티은행" },
  { code: "0031", name: "대구은행" },
  { code: "0032", name: "부산은행" },
  { code: "0034", name: "광주은행" },
  { code: "0035", name: "제주은행" },
  { code: "0037", name: "전북은행" },
  { code: "0039", name: "경남은행" },
  { code: "0045", name: "새마을금고" },
  { code: "0048", name: "신협은행" },
  { code: "0071", name: "우체국" },
  { code: "0081", name: "KEB하나은행" },
  { code: "0088", name: "신한은행" },
  { code: "0089", name: "K뱅크" },
];

const CARDS = [
  { code: "0301", name: "KB카드" },
  { code: "0302", name: "현대카드" },
  { code: "0303", name: "삼성카드" },
  { code: "0304", name: "NH카드" },
  { code: "0305", name: "BC카드" },
  { code: "0306", name: "신한카드" },
  { code: "0307", name: "씨티카드" },
  { code: "0309", name: "우리카드" },
  { code: "0311", name: "롯데카드" },
  { code: "0313", name: "하나카드" },
  { code: "0315", name: "전북카드" },
  { code: "0316", name: "광주카드" },
  { code: "0320", name: "수협카드" },
  { code: "0321", name: "제주카드" },
];

const ALL = [...BANKS, ...CARDS];

function MyDataConnect() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState([]);
  const [credentials, setCredentials] = useState({});
  const [loading, setLoading] = useState(false);

  const toggleSelect = (code) => {
    if (selected.includes(code)) {
      setSelected(selected.filter((c) => c !== code));
    } else {
      setSelected([...selected, code]);
    }
  };

  const handleNext = () => {
    if (selected.length === 0) return alert("최소 1개 이상 선택해주세요!");
    const init = {};
    selected.forEach((code) => {
      init[code] = { user_id: "", password: "" };
    });
    setCredentials(init);
    setStep(2);
  };

  const handleCredentialChange = (code, field, value) => {
    setCredentials({
      ...credentials,
      [code]: { ...credentials[code], [field]: value },
    });
  };

  const handleConnect = () => {
    const incomplete = selected.some(
      (code) => !credentials[code]?.user_id || !credentials[code]?.password
    );
    if (incomplete) return alert("모든 기관의 아이디와 비밀번호를 입력해주세요!");

    setLoading(true);
    setTimeout(() => {
      navigate("/login");
    }, 2500);
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#F0F8FF",
      }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px", color: "#0083CA" }}>So-Bee</h2>
        <p style={{ color: "#20C4F4", fontSize: "13px", marginBottom: "32px" }}>스마트 소비 일기</p>
        <p style={{ color: "#555", fontSize: "16px" }}>마이데이터 연동 중...</p>
        <div style={{
          marginTop: "20px",
          width: "40px",
          height: "40px",
          border: "4px solid #0083CA",
          borderTop: "4px solid transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        minHeight: "100vh",
        backgroundColor: "#ffffff",
      }}>
        <h1 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "8px", color: "#0083CA", letterSpacing: "3px" }}>So-Bee</h1>
        <p style={{ color: "#20C4F4", fontSize: "13px", marginBottom: "8px" }}>마이데이터 연동</p>
        <p style={{ color: "#888", fontSize: "12px", marginBottom: "24px" }}>연동할 기관을 선택하세요 (여러 개 가능)</p>

        <p style={{ fontWeight: "bold", marginBottom: "8px", alignSelf: "flex-start", maxWidth: "300px", width: "100%", color: "#0083CA" }}>은행</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", width: "100%", maxWidth: "300px", marginBottom: "20px" }}>
          {BANKS.map((bank) => (
            <button
              key={bank.code}
              onClick={() => toggleSelect(bank.code)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: selected.includes(bank.code) ? "2px solid #0083CA" : "1px solid #ddd",
                backgroundColor: selected.includes(bank.code) ? "#E8F4FD" : "white",
                fontWeight: selected.includes(bank.code) ? "bold" : "normal",
                color: selected.includes(bank.code) ? "#0083CA" : "#555",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >{bank.name}</button>
          ))}
        </div>

        <p style={{ fontWeight: "bold", marginBottom: "8px", alignSelf: "flex-start", maxWidth: "300px", width: "100%", color: "#0083CA" }}>카드사</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", width: "100%", maxWidth: "300px", marginBottom: "32px" }}>
          {CARDS.map((card) => (
            <button
              key={card.code}
              onClick={() => toggleSelect(card.code)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: selected.includes(card.code) ? "2px solid #0083CA" : "1px solid #ddd",
                backgroundColor: selected.includes(card.code) ? "#E8F4FD" : "white",
                fontWeight: selected.includes(card.code) ? "bold" : "normal",
                color: selected.includes(card.code) ? "#0083CA" : "#555",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >{card.name}</button>
          ))}
        </div>

        <button
          onClick={handleNext}
          style={{
            width: "100%", maxWidth: "300px", padding: "14px",
            backgroundColor: "#0083CA", color: "white",
            border: "none", borderRadius: "10px",
            fontSize: "16px", fontWeight: "bold", cursor: "pointer",
          }}
        >다음 ({selected.length}개 선택)</button>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px",
      minHeight: "100vh",
      backgroundColor: "#ffffff",
    }}>
      <h1 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "8px", color: "#0083CA", letterSpacing: "3px" }}>So-Bee</h1>
      <p style={{ color: "#20C4F4", fontSize: "13px", marginBottom: "32px" }}>각 기관의 아이디와 비밀번호를 입력하세요</p>

      {selected.map((code) => {
        const institution = ALL.find((i) => i.code === code);
        return (
          <div key={code} style={{ width: "100%", maxWidth: "300px", marginBottom: "24px" }}>
            <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#0083CA" }}>{institution?.name}</p>
            <input
              placeholder="아이디"
              value={credentials[code]?.user_id || ""}
              onChange={(e) => handleCredentialChange(code, "user_id", e.target.value)}
              style={{
                width: "100%", padding: "12px", marginBottom: "8px",
                borderRadius: "10px", border: "1.5px solid #20C4F4",
                fontSize: "14px", boxSizing: "border-box", outline: "none",
              }}
            />
            <input
              placeholder="비밀번호"
              type="password"
              value={credentials[code]?.password || ""}
              onChange={(e) => handleCredentialChange(code, "password", e.target.value)}
              style={{
                width: "100%", padding: "12px",
                borderRadius: "10px", border: "1.5px solid #20C4F4",
                fontSize: "14px", boxSizing: "border-box", outline: "none",
              }}
            />
          </div>
        );
      })}

      <button
        onClick={handleConnect}
        style={{
          width: "100%", maxWidth: "300px", padding: "14px",
          backgroundColor: "#0083CA", color: "white",
          border: "none", borderRadius: "10px",
          fontSize: "16px", fontWeight: "bold", cursor: "pointer",
        }}
      >연동하기</button>
    </div>
  );
}

export default MyDataConnect;