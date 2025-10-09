import React from 'react'

const Footer = () => {
  return (
    <footer className='bg-gray-800 text-white'>
      <div className='max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 relative'>
          {/* Company Info */}
          <div>
            <h3 className='text-lg font-semibold mb-4'>Smart PDF Filler</h3>
            <p className='text-gray-300 mb-4'>
              Automatically fill PDF forms with intelligent text recognition and
              positioning.
            </p>
            <p className='text-sm text-gray-400'>Made with ❤️ by Ajin</p>
          </div>

          {/*Socials */}
          <div className='absolute right-24'>
            <h3 className='text-lg font-semibold mb-2'>Connect</h3>
            <div className='space-y-3'>
              <div className='flex items-center space-x-2'>
                <svg
                  className='h-5 w-5'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' />
                  <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z' />
                </svg>
                <a
                  href='mailto:ajincraju@gmail.com'
                  className='text-gray-300 hover:text-white transition-colors'
                >
                  Email
                </a>
              </div>

              <div className='flex items-center space-x-2'>
                <svg
                  className='h-5 w-5'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z'
                    clipRule='evenodd'
                  />
                </svg>
                <a
                  href='https://github.com/BlazeGaming456'
                  className='text-gray-300 hover:text-white transition-colors'
                >
                  GitHub
                </a>
              </div>

              <div className='flex items-center space-x-2'>
                <svg
                  className='h-5 w-5'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z'
                    clipRule='evenodd'
                  />
                </svg>
                <a
                  href='https://leetcode.com/u/ajincraju/'
                  className='text-gray-300 hover:text-white transition-colors'
                >
                  LeetCode
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='mt-8 pt-8 border-t border-gray-700'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <p className='text-gray-400 text-sm'>
              © 2024 Smart PDF Filler. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
