import { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './portal/css/globals.css'
import App from './App'
import Spinner from './portal/views/spinner/Spinner'

createRoot(document.getElementById('root')!).render(
  <Suspense fallback={<Spinner />}>
    <App />
  </Suspense>
)
