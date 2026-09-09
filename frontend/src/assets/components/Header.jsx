import { useState } from 'react';

const Header = ({ activeTab, setActiveTab }) => {
  // Removed unused status state
  return (
    <nav className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 mb-6">
      <button
        type="button"
        onClick={() => setActiveTab('user')}
        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
          activeTab === 'user'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        User
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('hospital')}
        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
          activeTab === 'hospital'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        Hospital
      </button>
    </nav>
  );
};

export default Header;