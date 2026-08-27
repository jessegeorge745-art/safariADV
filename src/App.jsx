import { useState } from 'react'
import Brand from "./components/Brand";
import ImageUploadField from './components/ImageUploadField';
import ProtectedRoute from './components/ProtectedRoute';
import WeatherWidget from './components/WeatherWidget';

function App() {
  const [count, setCount] = useState(0)

  return (
   <>
   <Brand/>
   <ImageUploadField/>
   <ProtectedRoute/>
   <WeatherWidget/>
   </>
  )
}

export default App
