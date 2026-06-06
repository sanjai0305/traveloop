// src/pages/Register.jsx


// LAYOUT
import AuthLayout from "../layouts/AuthLayout";

// COMPONENTS
import RegisterCard from "../components/auth/RegisterCard";

const Register = () => {
  return (
    <AuthLayout>
      
      {/* REGISTER CARD */}
      <RegisterCard />

    </AuthLayout>
  );
};

export default Register;