import HomePage from './pages/home'; // ✅ index.jsx로 변경됨
import CalendarPage from './pages/calendar'; // index.jsx로 되어 있으므로 폴더만 import
import NotificationPage from './pages/notification';
import PerformanceListPage from './pages/performance/PerformanceListPage';
import PerformanceDetailPage from './pages/performance/PerformanceDetailPage';
import ArtistListPage from './pages/artist/ArtistListPage';
import ArtistDetailPage from './pages/artist/ArtistDetailPage';
import FavoritePage from './pages/favorite/FavoritePage';
import React from 'react';
import LoginPage from './pages/login/LoginPage'; 
import MyPage from './pages/mypage/MyPage'; 
import Search from './pages/search/Search'; 
import Search2 from './pages/search/Search2';
import Search3 from './pages/search/Search3';
import Search4 from './pages/search/Search4';
import BulletinBoard from './pages/bulltetin/bulletinboard';
import BulletinWrite from './pages/bulltetin/bulletinwrite';
import Bulletindetail from './pages/bulltetin/bulletindetail';
import MapPage from './pages/map/MapPage';
import ListVenue from './pages/venue/ListVenue';
import DetailVenue from './pages/venue/DetailVenue';
import LoginSuccess from './pages/login/LoginSuccess';
import PickListPage from './pages/pick/PickListPage';

const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/notification', element: <NotificationPage /> },
  { path: '/calendar', element: <CalendarPage /> },
  { path: '/performance', element: <PerformanceListPage /> },
  { path: '/performance/:id', element: <PerformanceDetailPage /> },
  { path: '/artist', element: <ArtistListPage /> },
  { path: '/artist/:id', element: <ArtistDetailPage /> },
  { path: '/favorite', element: <FavoritePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/mypage', element: <MyPage /> },
  { path: '/search', element: <Search /> },
  { path: '/search1/result', element: <Search2 /> },
  { path: '/search3', element: <Search3 /> },
  { path: '/search4', element: <Search4 /> },
  { path: '/bulletinwrite', element: <BulletinWrite /> },
  { path: '/bulletinboard', element: <BulletinBoard /> },
  { path: '/freeboard/:id', element: <Bulletindetail /> },
  { path: '/map', element: <MapPage /> },
  { path: '/venue', element: <ListVenue /> },
  { path: '/venue/:id', element: <DetailVenue /> },
  { path: '/picks', element: <PickListPage /> },
  {path: '/login/success', element: <LoginSuccess/>}, 
];

export default routes;

