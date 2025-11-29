import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthorizationCard from "./components/AuthorizationCard.jsx";
import MainPage from "./components/MainPage.jsx";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext.jsx";

function App() {
    const { isAuthenticated } = useContext(AuthContext);

  return (
      <Router>
          <Routes>
              <Route path="/auth" element={<AuthorizationCard />} />
              <Route path="/" element={isAuthenticated ? <MainPage /> : <Navigate to="/auth" />} />
          </Routes>
      </Router>
  )
}

export default App
