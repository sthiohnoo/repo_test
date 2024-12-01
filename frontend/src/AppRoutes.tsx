import { Navigate, Route, RouteProps, Routes } from 'react-router-dom';
import { ShoppingListPage } from './pages/ShoppingListPage.tsx';
import { ItemsPage } from './pages/ItemsPage.tsx';

export type RouteConfig = RouteProps & {
  /**
   * Required route path.
   * E.g. /home
   */
  path: string;
};

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: <Navigate to="/shoppingLists" replace />,
    index: true,
  },
  {
    path: '/shoppingLists',
    element: <ShoppingListPage />,
  },
  {
    path: '/items',
    element: <ItemsPage />,
  },
];

const renderRouteMap = ({ element, ...restRoute }: RouteConfig) => {
  return <Route key={restRoute.path} {...restRoute} element={element} />;
};

export const AppRoutes = () => {
  return <Routes>{routes.map(renderRouteMap)}</Routes>;
};
