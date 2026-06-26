import { Outlet } from 'react-router-dom';
import AuthBackground from '../components/AuthBackground';
import '../pages/Login.css';

export default function AuthLayout() {
  return (
    <div className="login-page">
      <AuthBackground>
        <Outlet />
      </AuthBackground>
    </div>
  );
}
