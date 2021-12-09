import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import qs from "qs";

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

function App() {
  const { task, session } = qs.parse(window.location.search.slice(1));
  const [sessionDetails, setSessionDetails] = useState<RegistrationDetail>({
    loading: true,
  });
  useEffect(() => {
    fetch(`/api/authorization/${session}`)
      .then((r) => r.json())
      .then(setSessionDetails);
  }, [task, session]);

  const clickApprove = async () => {
    console.log("Approve.");

    const f = document.createElement("form");
    f.action = `/api/authorization/${session}/approve`
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
