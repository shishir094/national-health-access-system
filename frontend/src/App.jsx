// App.jsx
import { Routes, Route } from 'react-router-dom';
import Login from './assets/pages/Login.jsx';
import LoginCopy from './assets/components/UserForm.jsx'
import Admin from './assets/pages/Admin.jsx'
import AdminDashboard from './assets/pages/AdminDashboard.jsx'
import Dashboard from './assets/pages/Dashboard.jsx'
import Register from './assets/pages/LoginCopy.jsx'
import HospitalLogin from './assets/pages/HospitalLogin.jsx'
import HospitalDashboard from './assets/pages/HospitalDashboard.jsx'
import HospitalForm from './assets/components/HospitalForm.jsx';
import Form from './assets/pages/Form.jsx'
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/AdminDashboard" element={<AdminDashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/hlogin" element={<HospitalLogin />} />
      <Route path="/hregister" element={<HospitalForm />} />
      <Route path="/hospitaldashboard" element={<HospitalDashboard />} />
      <Route path="/form" element={<Form />} />
    </Routes>
  );
}

export default App;