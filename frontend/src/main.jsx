import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import HomeWireframe from './wireframes/HomeWireframe.jsx'
import LoadingWireframe from './wireframes/LoadingWireframe.jsx'
import CoWatcherObserverWireframe from './wireframes/CoWatcherObserverWireframe.jsx'
import CoWatcherSpeakerWireframe from './wireframes/CoWatcherSpeakerWireframe.jsx'
import './index.css'

const params = new URLSearchParams(window.location.search)
const wireframe = params.get('wireframe')

const WIREFRAMES = {
  home: <HomeWireframe />,
  loading: <LoadingWireframe />,
  observer: <CoWatcherObserverWireframe />,
  speaker: <CoWatcherSpeakerWireframe />,
}

const Root = WIREFRAMES[wireframe] ?? <App />

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {Root}
  </React.StrictMode>,
)
