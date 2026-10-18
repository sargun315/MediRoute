import AppRoutes from '../../src/routes/AppRoutes.jsx'
import { AuthProvider } from '../../src/context/AuthContext.jsx'

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}
