'use client'

import React from 'react'
import { useState } from 'react'

export default function page () {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    if (!file) {
      setMessage('Please select a PDF file first!')
      return
    }

    setMessage('Processing...')

    try {
      const formData = new FormData()
      formData.append('pdf', file)
      formData.append('name', 'Ajin')

      const res = await fetch('/api/fill-pdf', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'filled_form.pdf'
        link.click()
        setMessage('PDF filled successfully!')
      } else {
        const errorData = await res.json()
        setMessage(`Error: ${errorData.error || 'Something went wrong!'}`)
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    }
  }

  return (
    <div className='bg-gray-50 flex flex-col items-center py-16 min-h-screen'>
      <div className='text-center mb-3'>
        <h1 className='text-5xl md:text-6xl font-bold mb-4 text-gray-800'>
          Smart PDF Form Filler
        </h1>
        <p className='text-gray-600 text-lg md:text-xl max-w-2xl mx-auto'>
          Automatically fill PDF forms with intelligent text recognition. Upload
          your PDF and let our smart system do the rest!
        </p>
      </div>

      <div className='rounded-xl p-8 w-full max-w-md'>
        <form
          onSubmit={handleSubmit}
          className='flex flex-col items-center justify-center space-y-6'
        >
          {/* Hidden file input */}
          <input
            type='file'
            accept='application/pdf'
            id='pdf-upload'
            onChange={(e) => {
              setFile(e.target.files[0])
              handleSubmit(e);
            }}
            className='hidden'
          />

          {/* Styled label acts as button */}
          <label
            htmlFor='pdf-upload'
            className='rounded-xl bg-red-500 text-white text-2xl font-semibold py-8 px-24 cursor-pointer hover:bg-red-600 transition-all duration-200 shadow-md'
          >
            Select PDF file
          </label>

          {file && (
            <p className='mt-2 text-sm text-gray-600'>
              Selected: <span className='font-medium'>{file.name}</span>
            </p>
          )}
        </form>

        {message && (
          <div
            className={`mt-6 p-4 rounded-lg text-center ${
              message.includes('Error')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : message.includes('successfully')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            <p className='text-sm font-medium'>{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
