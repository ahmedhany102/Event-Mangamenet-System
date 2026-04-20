import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

type ProtectedRouteProps = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAdmin = localStorage.getItem('isAdmin') === 'true'

  if (!isAdmin) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}