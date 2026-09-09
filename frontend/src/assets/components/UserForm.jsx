import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
const locationData = {
  'Koshi': ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Tehrathum', 'Udayapur'],
  'Madhesh': ['Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'],
  'Bagmati': ['Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok'],
  'Gandaki': ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi', 'Nawalpur (Nawalparasi East)', 'Parbat', 'Syangja', 'Tanahu'],
  'Lumbini': ['Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Gulmi', 'Kapilvastu', 'Parasi (Nawalparasi West)', 'Palpa', 'Pyuthan', 'Rolpa', 'Rukum East', 'Rupandehi'],
  'Karnali': ['Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu', 'Salyan', 'Surkhet', 'Rukum West'],
  'Sudurpashchim': ['Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur']
};

const UserForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    province: '',
    district: '',
    email: '',
    password: '',
    confirmPassword: '',
    citizenship: ''
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full Name is required.";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters.";
    }

    if (!formData.province) newErrors.province = "Please select a province.";
    if (!formData.district) newErrors.district = "Please select a district.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email address is required.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    const citizenshipRegex = /^[0-9/-]+$/;
    if (!formData.citizenship.trim()) {
      newErrors.citizenship = "Citizenship number is required.";
    } else if (!citizenshipRegex.test(formData.citizenship)) {
      newErrors.citizenship = "Citizenship number should contain numbers and hyphens only.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const navigate = useNavigate(); // 2. Initialize the navigation hook
  
  
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
          <h2 className="text-2xl font-bold text-slate-800">User Account</h2>
          <p className="text-sm text-slate-500 mt-1">Please enter your personal details to register</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          
          {/* Full Name */}
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
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Province & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Province
              </label>
              <select 
                name="province" 
                value={formData.province} 
                onChange={handleChange} 
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                  errors.province ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              >
                <option value="">--Select--</option>
                {Object.keys(locationData).map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
              {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
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
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.district ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              >
                <option value="">{formData.province ? 'Select' : 'Choose Province'}</option>
                {listDistrict.map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
              {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
            </div>
          </div>

          {/* Email Address */}
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
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          {/* Citizenship Number */}
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
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                errors.citizenship ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {errors.citizenship && <p className="text-red-500 text-xs mt-1">{errors.citizenship}</p>}
          </div>

          {/* Password & Confirm Password */}
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
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition mb-2 ${
                errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {errors.password && <p className="text-red-500 text-xs mb-2">{errors.password}</p>}

            <input 
              type="password" 
              name="confirmPassword" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              placeholder="Re-type password" 
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          

          <button 
            type="submit" 
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-lg shadow-md transition duration-150 ease-in-out cursor-pointer"
          >
            Submit User Registration
          </button>

        </form>
      </div>
    </div>
  );
};

export default UserForm;