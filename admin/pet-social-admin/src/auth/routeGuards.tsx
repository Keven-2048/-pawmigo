import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import AdminLayout from '../layouts/AdminLayout'
import { getToken } from './token'

export function PublicRoute({ children }: { children: ReactNode }) {
  if (getToken()) {
    return <Navigate replace to="/dashboard" />
  }

  return children
}

export function ProtectedRoute() {
  if (!getToken()) {
    return <Navigate replace to="/login" />
  }

  return <AdminLayout />
}
