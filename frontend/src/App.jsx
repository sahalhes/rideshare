import Register from './Register'
import Login from './Login'
import Home from './Home';
import Profile from './Profile';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth'; // For messages page when added
import PersistLogin from './components/PersistLogin';
import { Routes, Route, Navigate } from 'react-router-dom';

function App() {

  return (
    <Routes>
      <Route element={<PersistLogin />} >
        <Route path='/' element={<Layout />}>
          {/* Public Routes */}
          <Route path='/' element={<Home />} />
          <Route path='/profile/:username' element={<Profile />} />
          <Route path='register' element={<Register />} />
          <Route path='login' element={<Login />} />

          {/* 404 */}
          <Route path='*' element={<Navigate to="/" />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
