import React from 'react'
import Image from 'next/image'

const Navbar = () => {
  return (
    <nav className='bg-white shadow-lg border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <h1 className='text-xl font-bold text-gray-800'>
                📄 Smart PDF Filler
              </h1>
            </div>
          </div>

          {/* User Account */}
          <div className="p-[2px] rounded-full hover:bg-gray-300 hover:cursor-pointer transition-all duration-200">
      <Image
        src="/account.png"
        width={35}
        height={35}
        alt="Account icon"
        className="rounded-full"
      />
    </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
