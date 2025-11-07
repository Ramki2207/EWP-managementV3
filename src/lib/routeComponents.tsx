import React from 'react';
import Dashboard from '../pages/Dashboard';
import Projects from '../pages/Projects';
import Verdelers from '../pages/Verdelers';
import Clients from '../pages/Clients';
import Meldingen from '../pages/Meldingen';
import UrenstaatVerlof from '../pages/UrenstaatVerlof';
import Personeelsbeheer from '../pages/Personeelsbeheer';
import Uploads from '../pages/Uploads';
import Users from '../pages/Users';
import AccessCodes from '../pages/AccessCodes';
import ClientPortalManagement from '../pages/ClientPortalManagement';
import Insights from '../pages/Insights';
import Account from '../pages/Account';
import Help from '../pages/Help';
import PermissionRoute from '../components/PermissionRoute';

export const getComponentForPath = (path: string): React.ReactNode => {
  const routes: { [key: string]: React.ReactNode } = {
    '/dashboard': <PermissionRoute requiredPermission={{ module: 'dashboard', permission: 'read' }}><Dashboard /></PermissionRoute>,
    '/projects': <PermissionRoute requiredPermission={{ module: 'projects', permission: 'read' }}><Projects /></PermissionRoute>,
    '/verdelers': <PermissionRoute requiredPermission={{ module: 'verdelers', permission: 'read' }}><Verdelers /></PermissionRoute>,
    '/clients': <PermissionRoute requiredPermission={{ module: 'clients', permission: 'read' }}><Clients /></PermissionRoute>,
    '/meldingen': <PermissionRoute><Meldingen /></PermissionRoute>,
    '/urenstaat-verlof': <PermissionRoute><UrenstaatVerlof /></PermissionRoute>,
    '/personeelsbeheer': <PermissionRoute requiredPermission={{ module: 'worksheets', permission: 'read' }}><Personeelsbeheer /></PermissionRoute>,
    '/uploads': <PermissionRoute requiredPermission={{ module: 'uploads', permission: 'read' }}><Uploads /></PermissionRoute>,
    '/gebruikers': <PermissionRoute requiredPermission={{ module: 'gebruikers', permission: 'read' }}><Users /></PermissionRoute>,
    '/access-codes': <PermissionRoute requiredPermission={{ module: 'access_codes', permission: 'read' }}><AccessCodes /></PermissionRoute>,
    '/client-portals': <PermissionRoute requiredPermission={{ module: 'client_portals', permission: 'read' }}><ClientPortalManagement /></PermissionRoute>,
    '/insights': <PermissionRoute requiredPermission={{ module: 'insights', permission: 'read' }}><Insights /></PermissionRoute>,
    '/account': <PermissionRoute><Account /></PermissionRoute>,
    '/help': <PermissionRoute><Help /></PermissionRoute>,
  };

  return routes[path] || null;
};
