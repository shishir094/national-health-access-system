import { useState } from 'react';
import HospitalForm from '/src/assets/components/HospitalForm.jsx'; // Updated path relative to components folder
import UserForm from '/src/assets/components/UserForm.jsx';
import Header from '/src/assets/components/Header.jsx';

const Login = () => {
  const [activeTab, setActiveTab] = useState('user');

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* 
        Container width auto-adjusts depending on active tab:
        - User Form -> max-w-md (narrow card)
        - Hospital Form -> max-w-2xl (wider card for extra grid fields)
      */}
      <div 
        className={`w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8 transition-all duration-300 ${
          activeTab === 'hospital' ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        <div className="mb-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Create Account
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Choose your account type to proceed
          </p>
        </div>

        <Header activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="w-full">
          {activeTab === 'user' && <UserForm />}
          {activeTab === 'hospital' && <HospitalForm />}
        </div>
      </div>
    </div>
  );
};

export default Login;