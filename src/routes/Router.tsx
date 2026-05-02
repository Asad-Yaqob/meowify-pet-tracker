import { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import Loadable from 'src/layouts/full/shared/loadable/Loadable';
const Login = Loadable(lazy(() => import('src/views/authentication/auth2/Login')));
const Error = Loadable(lazy(() => import('src/views/authentication/Error')));
const BlankLayout = Loadable(lazy(() => import('src/layouts/blank/BlankLayout')));
const FullLayout = Loadable(lazy(() => import('src/layouts/full/FullLayout')));
const MeowifyDashboard = Loadable(lazy(() => import('src/views/dashboard/MeowifyDashboard')));
const PetList = Loadable(lazy(() => import('src/views/pets/PetList')));
const PetForm = Loadable(lazy(() => import('src/views/pets/PetForm')));
const PublicPetPage = Loadable(lazy(() => import('src/views/pets/PublicPetPage')));

import PrivateRoute from './PrivateRoute';

const Router = [
  { path: '/pet/:id', element: <PublicPetPage /> },

  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: 'portal/login', element: <Login /> },
      { path: '/404', element: <Error /> },
    ],
  },

  {
    path: '/portal',
    element: <PrivateRoute />,
    children: [
      {
        element: <FullLayout />,
        children: [
          { index: true, element: <Navigate to="/portal/dashboard" /> },
          { path: 'dashboard', element: <MeowifyDashboard /> },
          { path: 'pets', element: <PetList /> },
          { path: 'pets/create', element: <PetForm /> },
          { path: 'pets/edit/:id', element: <PetForm /> },
        ],
      },
    ],
  },

  {
    path: '*',
    element: <Navigate to="/portal/login" />,
  },
];

const router = createBrowserRouter(Router);

export default router;
