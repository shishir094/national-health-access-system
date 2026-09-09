import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const Form = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [selectedHospital, setSelectedHospital] = useState(null); // Holds hospital object when modal is open
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
  });

  // Fetch Hospitals List
  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/hospitals`, { withCredentials: true });
      setHospitals(res.data.data || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch hospitals directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  // Extract Universal ID helper
  const getHospitalId = (h) => h.hospital_id || h.hospitalId || h._id || h.id;

  // Modal Handlers
  const openBookingModal = (hospital) => {
    setSelectedHospital(hospital);
    setBookingError('');
    setBookingSuccess('');
    setFormData({
      patientName: '',
      patientPhone: '',
      appointmentDate: '',
      appointmentTime: '',
      notes: '',
    });
  };

  const closeBookingModal = () => {
    if (isSubmitting) return;
    setSelectedHospital(null);
    setBookingError('');
    setBookingSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    const hospitalId = getHospitalId(selectedHospital);
    if (!hospitalId) {
      setBookingError('Invalid Hospital Selection.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        `${API_BASE_URL}/appointments`,
        {
          hospitalId,
          ...formData,
        },
        { withCredentials: true }
      );

      setBookingSuccess('Appointment booked successfully!');
      setTimeout(() => {
        closeBookingModal();
      }, 1500);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-900 min-h-screen text-slate-300 flex items-center justify-center">
        <p className="animate-pulse text-sm">Loading hospitals...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 relative">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Title */}
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-xl font-bold">Available Hospitals</h1>
          <p className="text-xs text-slate-400">Select a hospital to schedule an appointment</p>
        </header>

        {error && <p className="text-rose-400 text-xs">{error}</p>}

        {/* Hospital Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hospitals.map((hospital, idx) => {
            const hId = getHospitalId(hospital);
            return (
              <div
                key={hId || idx}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-600 transition"
              >
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-white">{hospital.name || 'Hospital Name'}</h3>
                  <p className="text-xs text-slate-400">
                    {hospital.district || 'Location N/A'}, {hospital.province || ''}
                  </p>
                  <p className="text-xs text-slate-300">
                    <span className="text-slate-500 font-medium">Type: </span>
                    {hospital.hospital_type || 'General Hospital'}
                  </p>
                  <p className="text-xs text-slate-300">
                    <span className="text-slate-500 font-medium">Contact: </span>
                    {hospital.phone || hospital.email || 'N/A'}
                  </p>
                </div>

                <button
                  onClick={() => openBookingModal(hospital)}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
                >
                  Book Appointment
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Form Modal Overlay */}
      {selectedHospital && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-700 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Book Appointment</h2>
                <p className="text-xs text-blue-400 font-medium">{selectedHospital.name}</p>
              </div>
              <button
                onClick={closeBookingModal}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Notifications */}
            {bookingError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
                {bookingError}
              </div>
            )}
            {bookingSuccess && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
                {bookingSuccess}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Patient Full Name</label>
                <input
                  type="text"
                  name="patientName"
                  required
                  value={formData.patientName}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Phone Number</label>
                <input
                  type="tel"
                  name="patientPhone"
                  required
                  value={formData.patientPhone}
                  onChange={handleInputChange}
                  placeholder="e.g. +977 98XXXXXXXX"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Preferred Date</label>
                  <input
                    type="date"
                    name="appointmentDate"
                    required
                    value={formData.appointmentDate}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Preferred Time</label>
                  <input
                    type="time"
                    name="appointmentTime"
                    required
                    value={formData.appointmentTime}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Medical Notes / Reason (Optional)</label>
                <textarea
                  name="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Brief description of consultation reason..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeBookingModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition cursor-pointer disabled:bg-slate-700"
                >
                  {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Form;