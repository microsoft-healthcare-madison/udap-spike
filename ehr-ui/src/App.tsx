import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import qs from "qs";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

interface RegistrationDetail {
  loading: boolean;
  request?: {
    scope: string;
  };
  registration?: {
    client_name: string;
    redirect_uris: string[];
    certification_issuer: string;
    certification_name: string;
    certification_logo: string;
    certification_uris: string[];
    is_endorsement: boolean;
    developer_name: string;
  };
}

function AuthScreen(props: { onLogin: () => void }) {
  const [username, setUsername] = useState("testuser");
  const [challenge, setChallenge] = useState("");
  const [debuggingData, setDebuggingData] = useState("");

  async function register() {
    const webauthn = await fetch(`/ehr/api/webauthn/register`).then(r=>r.json())
    const attResp = await startRegistration(webauthn);

    const verificationResp = await fetch(`/ehr/api/webauthn/register/verify/${webauthn.user.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attResp),
    }).then(r => r.json());

    localStorage.setItem("credentialID", attResp.id);
    if  (verificationResp) {
      setDebuggingData(JSON.stringify(attResp, null, 2))
    }
  }

  async function login() {
    const webauthn = await fetch(`/ehr/api/webauthn/login`).then(r=>r.json());
    (webauthn.allowCredentials = webauthn.allowCredentials || []).push({
      id: localStorage.getItem("credentialID"),
      type: "public-key"
    })

    const resp = await startAuthentication(webauthn);

    const submission = await fetch(`/ehr/api/webauthn/login/verify/${webauthn.challenge}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resp),
    }).then(r=>r.json());

    if (submission === true) {
      props.onLogin()
      setDebuggingData(JSON.stringify(resp, null, 2))
    }
  }


  useEffect(() => {});

  return (
    <>
      <h1>Authenticate Please </h1>
      <ul>
        <li>
          Username:{" "}
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </li>
        <li>
          <button onClick={register}>Register</button>
        </li>
        <li>
          <button onClick={login}>Log in</button>
        </li>
 
       <li>
          <button onClick={props.onLogin}>Fake Log in</button>
        </li>

          {debuggingData && <code>${debuggingData}</code>}
      </ul>
    </>
  );
}

function App() {
  const { task, session } = qs.parse(window.location.search.slice(1));
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  const [sessionDetails, setSessionDetails] = useState<RegistrationDetail>({
    loading: true,
  });

  useEffect(() => {
    if (!session) {
      return;
    }
    fetch(`/ehr/api/authorization/${session}`)
      .then((r) => r.json())
      .then(setSessionDetails);
  }, [task, session, authenticated]);

  if (!authenticated) {
    return <AuthScreen onLogin={() => setAuthenticated(true)} />;
  }

  const clickApprove = async () => {
    const f = document.createElement("form");
    f.action = `/ehr/api/authorization/${session}/approve`;
    f.method = "POST";
    f.target = "_blank";
    document.body.appendChild(f);
    f.submit();
  };

  return (
    <>
      <h1>Access Request</h1>
      <h2>App Details</h2>
      <ul>
        <li>Session: {session}</li>
        <li>App Name: {sessionDetails?.registration?.client_name}</li>
        <li>App Developer: {sessionDetails?.registration?.developer_name}</li>
        <li>
          App Certification:{" "}
          <a href={sessionDetails?.registration?.certification_uris?.[0]}>
            {sessionDetails.registration?.certification_name}
          </a>
        </li>
      </ul>
      <h2>Data details</h2>
      <ul>
        <li>Scope: {sessionDetails?.request?.scope}</li>
      </ul>
      <h2>Your decision</h2>
      <ul>
        <li>
          <button onClick={clickApprove}>Approve this app</button>
        </li>
        <li>
          <button>Decline</button>
        </li>
      </ul>
    </>
  );
}

export default App;
