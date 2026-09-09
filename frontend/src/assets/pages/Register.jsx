import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import axios from 'axios';
import Login from './Login.jsx'
const locationData = {
  'Koshi': [
    'Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 
    'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 
    'Solukhumbu', 'Sunsari', 'Taplejung', 'Tehrathum', 'Udayapur'
  ],
  'Madhesh': [
    'Bara', 'Dhanusha', 'Mahottari', 'Parsa', 
    'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'
  ],
  'Bagmati': [
    'Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 
    'Kathmandu', 'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 
    'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok'
  ],
  'Gandaki': [
    'Baglung', 'Gorkha', 'Kaski', 'Lamjung', 
    'Manang', 'Mustang', 'Myagdi', 'Nawalpur (Nawalparasi East)', 
    'Parbat', 'Syangja', 'Tanahu'
  ],
  'Lumbini': [
    'Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 
    'Gulmi', 'Kapilvastu', 'Parasi (Nawalparasi West)', 'Palpa', 
    'Pyuthan', 'Rolpa', 'Rukum East', 'Rupandehi'
  ],
  'Karnali': [
    'Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 
    'Jumla', 'Kalikot', 'Mugu', 'Salyan', 
    'Surkhet', 'Rukum West'
  ],
  'Sudurpashchim': [
    'Achham', 'Baitadi', 'Bajhang', 'Bajura', 
    'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur'
  ]
};

const Register = () => {
  const navigate = useNavigate(); // 2. Initialize the navigation hook

  const [formData, setFormData] = useState({
    name: '',
    province: '',
    district: '',
    email: '',
    password: '',
    confirmPassword: '',
    citizenship: ''
  });

  const handleChange = (e) => {
    if (e.target.name === 'province') {
      setFormData({ ...formData, province: e.target.value, district: '' });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const { confirmPassword, ...payload } = formData;

    axios.post('http://localhost:5000/api/auth/register', payload)
      .then((response) => {
        alert(response.data?.message || "Registration successful!");
        setFormData({
          name: '',
          province: '',
          district: '',
          email: '',
          password: '',
          confirmPassword: '',
          citizenship: ''
        });
        
        // 3. Redirect to the login page upon success
        navigate('/Login');
      })
      .catch((error) => {
        alert(error.response?.data?.message || 'Failed to connect to backend.');
      });
  };

  const listDistrict = formData.province ? locationData[formData.province] : [];

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
          <p className="text-sm text-slate-500 mt-1">Please fill in your details to register</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Full Name
            </label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Enter your name" 
              required 
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Province
              </label>
              <select 
                name="province" 
                value={formData.province} 
                onChange={handleChange} 
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              >
                <option value="">--Select--</option>
                {Object.keys(locationData).map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                District
              </label>
              <select 
                name="district" 
                value={formData.district} 
                onChange={handleChange} 
                disabled={!formData.province} 
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{formData.province ? 'Select' : 'Choose Province'}</option>
                {listDistrict.map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Email Address
            </label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="you@example.com" 
              required 
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Password
            </label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              placeholder="••••••••" 
              required 
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition mb-2"
            />
            <input 
              type="password" 
              name="confirmPassword" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              placeholder="Re-type password" 
              required 
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Citizenship Number
            </label>
            <input 
              type="text" 
              name="citizenship" 
              value={formData.citizenship} 
              onChange={handleChange} 
              placeholder="e.g. 12-01-78-12345" 
              required 
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <button 
            type="submit" 
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-lg shadow-md hover:shadow-blue-200 transition duration-150 ease-in-out cursor-pointer"
          >
            Submit
          </button>

        </form>
      </div>
    </div>
  );
};

export default Register;