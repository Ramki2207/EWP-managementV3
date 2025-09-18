import React from 'react';

const Loader = () => {
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#4169e1]"></div>
    </div>
  );
};

export default Loader;