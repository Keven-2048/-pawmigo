import { Navigate, createBrowserRouter } from 'react-router-dom'

import { ProtectedRoute, PublicRoute } from './auth/routeGuards'
import AdminsPage from './pages/admins'
import AnnouncementsPage from './pages/announcements'
import CommentsPage from './pages/comments'
import DashboardPage from './pages/dashboard'
import InvitesPage from './pages/invites'
import LoginPage from './pages/login'
import PetsPage from './pages/pets'
import PostsPage from './pages/posts'
import ReportsPage from './pages/reports'
import UsersPage from './pages/users'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate replace to="/dashboard" /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'pets', element: <PetsPage /> },
      { path: 'posts', element: <PostsPage /> },
      { path: 'comments', element: <CommentsPage /> },
      { path: 'invites', element: <InvitesPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'announcements', element: <AnnouncementsPage /> },
      { path: 'admins', element: <AdminsPage /> },
    ],
  },
  { path: '*', element: <Navigate replace to="/dashboard" /> },
])
