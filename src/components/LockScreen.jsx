import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import Button from "./ui/Button";
import { Input } from "./ui/Input";

export default function LockScreen({ locked, pinCode = "1615", onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  if (!locked) return null;

  const submit = (event) => {
    event.preventDefault();
    if (pin === String(pinCode || "")) {
      setPin("");
      setError("");
      onUnlock();
      return;
    }
    setError("PIN hatalı");
  };

  return (
    <div className="lock-screen">
      <form className="lock-card" onSubmit={submit}>
        <span className="lock-icon"><LockKeyhole size={34} /></span>
        <h2>Oturum Kilitlendi</h2>
        <p>Devam etmek için kasa PIN kodunu girin.</p>
        <Input label="PIN" type="password" inputMode="numeric" autoFocus value={pin} onChange={(event) => setPin(event.target.value)} />
        {error ? <strong className="lock-error">{error}</strong> : null}
        <Button variant="primary" size="large" type="submit">Kilidi Aç</Button>
      </form>
    </div>
  );
}
