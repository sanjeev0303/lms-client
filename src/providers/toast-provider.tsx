'use client'

import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      expand={false}
      theme="system"
      closeButton
      visibleToasts={5}
      toastOptions={{
        style: {
          background: 'white',
          color: 'black',
          border: '1px solid #e5e7eb',
        },
        className: 'sonner-toast',
        descriptionClassName: 'sonner-toast-description',
      }}
    />
  )
}
