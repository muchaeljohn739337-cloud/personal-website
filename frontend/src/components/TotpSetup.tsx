import Image from "next/image"; // ✅ Use Next.js image optimization
import { useState } from "react";

const TotpSetup = () => {
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");

  const handleSecretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecret(e.target.value);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Submit logic here
  };

  return (
    <div className="totp-setup-container">
      <h1>Set up Two-Factor Authentication (TOTP)</h1>

      <p>
        You&apos;ll need to scan the QR code or enter the secret manually in
        your authenticator app.
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="totp-secret">
          Secret:
          <input
            id="totp-secret"
            name="totp-secret"
            type="text"
            value={secret}
            onChange={handleSecretChange}
            autoComplete="off"
          />
        </label>

        <label htmlFor="totp-code">
          Code:
          <input
            id="totp-code"
            name="totp-code"
            type="text"
            value={code}
            onChange={handleCodeChange}
            autoComplete="one-time-code"
          />
        </label>

        <button type="submit">Verify</button>
      </form>

      <div className="qr-code">
        <Image src="/totp-qr.png" alt="TOTP QR Code" width={200} height={200} />
      </div>

      <p>
        Don&apos;t have an app? Download Google Authenticator or Authy from your
        app store.
      </p>
    </div>
  );
};

export default TotpSetup;
