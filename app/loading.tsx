import React from 'react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 border-2 border-[#E6E8EE] border-t-[#E32B2B] rounded-full animate-spin"
          aria-hidden="true"
        />
        <p className="text-xs font-medium text-[#64748B]">Loading workspace...</p>
      </div>
    </div>
  );
}
