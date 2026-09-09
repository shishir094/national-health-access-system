import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const locationData = {
  'Koshi': ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Tehrathum', 'Udayapur'],
  'Madhesh': ['Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'],
  'Bagmati': ['Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok'],
  'Gandaki': ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi', 'Nawalpur (Nawalparasi East)', 'Parbat', 'Syangja', 'Tanahu'],
  'Lumbini': ['Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Gulmi', 'Kapilvastu', 'Parasi (Nawalparasi West)', 'Palpa', 'Pyuthan', 'Rolpa', 'Rukum East', 'Rupandehi'],
  'Karnali': ['Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu', 'Salyan', 'Surkhet', 'Rukum West'],
  'Sudurpashchim': ['Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur']
};

const HospitalForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    hospital_type: '', 
    hospital_bed_capacity: '',
    province: '',    
    district: '', 
    municipality: '', 
    email: '',
    phone: '',
    emergency_contact: '', 
    hospital_document: '', // Set initial state as empty string instead of null
    password: '',
    confirm_password: ''
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Hospital name is required.";
    if (!formData.license_number.trim()) newErrors.license_number = "Registration/License number is required.";
    if (!formData.hospital_type) newErrors.hospital_type = "Please select hospital type.";
    if (!formData.province) newErrors.province = "Please select a province.";
    if (!formData.district) newErrors.district = "Please select a district.";
    if (!formData.municipality.trim()) newErrors.municipality = "Street address/Municipality is required.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Official email is required.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    const phoneRegex = /^[0-9+--\s]{7,15}$/;
    if (!formData.phone) {
      newErrors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Enter a valid phone number.";
    }

    if (!formData.emergency_contact) {
      newErrors.emergency_contact = "Emergency contact is required.";
    }

    if (!formData.hospital_bed_capacity || formData.hospital_bed_capacity <= 0) {
      newErrors.hospital_bed_capacity = "Please enter a valid number of beds.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    if (formData.confirm_password !== formData.password) {
      newErrors.confirm_password = "Passwords do not match.";
    }

    const urlRegex = /^(https?:\/\/)?([\w.-]+)+[\w\-_~:/?#[\]@!$&'()*+,;=.]+$/;
    const documentUrl = formData.hospital_document ? formData.hospital_document.trim() : '';
    
    if (!documentUrl) {
      newErrors.hospital_document = "Please provide a document URL.";
    } else if (!urlRegex.test(documentUrl)) {
      newErrors.hospital_document = "Enter a valid URL (e.g., https://example.com/doc.pdf).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'province') {
      setFormData({ ...formData, province: value, district: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const { confirm_password, ...payload } = formData;
      
      // Ensure hospital_bed_capacity is converted to a number
      payload.hospital_bed_capacity = parseInt(payload.hospital_bed_capacity, 10);

      axios.post(
        'http://localhost:5000/api/auth/register/hospital', 
        payload, 
        { withCredentials: true } // Required for handling authentication cookies
      )
        .then((response) => {
          alert(response.data?.message || "Registration successful!");
          setFormData({
            name: '',
            license_number: '',
            hospital_type: '', 
            hospital_bed_capacity: '',
            province: '',    
            district: '', 
            municipality: '', 
            email: '',
            phone: '',
            emergency_contact: '', 
            hospital_document: '',
            password: '',
            confirm_password: ''
          });
          navigate('/hlogin');
        })
        .catch((error) => {
          alert(error.response?.data?.message || 'Failed to connect to backend.');
        });
    }
  };

  const listDistrict = formData.province ? locationData[formData.province] : [];

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
        
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-800">Hospital Registration</h2>
          <p className="text-sm text-slate-500 mt-1">Register your medical facility for verification</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          
          {/* Hospital Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Hospital / Clinic Name
              </label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g. City General Hospital" 
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                  errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Govt. Reg. / License No.
              </label>
              <input 
                type="text" 
                name="license_number" 
                value={formData.license_number} 
                onChange={handleChange} 
                placeholder="e.g. REG-98472-HC" 
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                  errors.license_number ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.license_number && <p className="text-red-500 text-xs mt-1">{errors.license_number}</p>}
            </div>
          </div>

          {/* Type & Bed Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Hospital Type
              </label>
              <select 
                name="hospital_type" 
                value={formData.hospital_type} 
                onChange={handleChange} 
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                  errors.hospital_type ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              >
                <option value="">--Select Type--</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
              </select>
              {errors.hospital_type && <p className="text-red-500 text-xs mt-1">{errors.hospital_type}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Total Bed Capacity
              </label>
              <input 
                type="number" 
                name="hospital_bed_capacity" 
                value={formData.hospital_bed_capacity} 
                onChange={handleChange} 
                placeholder="e.g. 150" 
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                  errors.hospital_bed_capacity ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.hospital_bed_capacity && <p className="text-red-500 text-xs mt-1">{errors.hospital_bed_capacity}</p>}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Street / Municipality
              </label>
              <input 
                type="text" 
                name="municipality" 
                value={formData.municipality} 
                onChange={handleChange} 
                placeholder="Ward No. / Street" 
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                  errors.municipality ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.municipality && <p className="text-red-500 text-xs mt-1">{errors.municipality}</p>}
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Official Email
              </label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="info@hospital.com" 
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                  errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Hospital Phone
              </label>
              <input 
                type="text" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="01-XXXXXXX" 
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                  errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Emergency Contact
              </label>
              <input 
                type="text" 
                name="emergency_contact" 
                value={formData.emergency_contact} 
                onChange={handleChange} 
                placeholder="24/7 Hotline Number" 
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                  errors.emergency_contact ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.emergency_contact && <p className="text-red-500 text-xs mt-1">{errors.emergency_contact}</p>}
            </div>
          </div>

          {/* Document URL Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Document URL (PDF/PNG/JPG Link)
            </label>
            <input 
              type="text" 
              name="hospital_document" 
              value={formData.hospital_document}
              onChange={handleChange} 
              placeholder="https://example.com/document.pdf"
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                errors.hospital_document ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {errors.hospital_document && <p className="text-red-500 text-xs mt-1">{errors.hospital_document}</p>}
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                  errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Confirm Password
              </label>
              <input 
                type="password" 
                name="confirm_password" 
                value={formData.confirm_password} 
                onChange={handleChange} 
                placeholder="Re-type password" 
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition ${
                  errors.confirm_password ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>}
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full mt-4 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-lg shadow-md transition duration-150 ease-in-out cursor-pointer"
          >
            Submit Hospital Application
          </button>

        </form>
      </div>
    </div>
  );
};

export default HospitalForm;