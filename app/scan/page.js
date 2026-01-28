'use client'
import React, { useState } from "react"

export default function App() {
  const [folder, setFolder] = useState("")
  const [results, setResults] = useState([])

  const handleScan = async () => {
    const res = await fetch("http://localhost:4000/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folder: "C:/Users/64169/Documents/miniprojects/mpaas-dplk", // change as needed
      }),
    })
    const data = await res.json()
    console.log("data from BE:", data)
    setResults(data)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>JS File Scanner</h2>

      <input
        type="text"
        placeholder="Enter folder path..."
        value={folder}
        onChange={(e) => setFolder(e.target.value)}
        style={{ width: 300, marginRight: 10 }}
      />
      <button onClick={handleScan}>Scan</button>

      <div style={{ marginTop: 20 }}>
        {results.length === 0 && <div>No results yet</div>}
        {results.map((file, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <b>{file.file}</b>
            <div>
              <strong>Data:</strong>
              <ul>
                {file.data && file.data.length > 0 ? (
                  file.data.map((d, idx) => <li key={idx}>{d}</li>)
                ) : (
                  <li>(none)</li>
                )}
              </ul>
            </div>
            <div>
              <strong>Functions:</strong>
              <ul>
                {file.functions && file.functions.length > 0 ? (
                  file.functions.map((fn, idx) => <li key={idx}>{fn}</li>)
                ) : (
                  <li>(none)</li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}