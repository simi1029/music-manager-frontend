'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
          {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="hidden sm:inline">{session.user?.name || session.user?.email}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
              <div className="font-medium">{session.user?.name}</div>
              <div className="text-xs text-gray-500">{session.user?.email}</div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: '/auth/signin' });
              }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
