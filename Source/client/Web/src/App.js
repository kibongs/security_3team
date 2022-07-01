import './App.css';

import Dashboard from './pages/index';
import Login from './pages/login';
import NotFound from './pages/notfound';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';

function App() {
  const [jwt, setJwt] = useState('');

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={<Dashboard setJwt={setJwt} jwt={jwt} />} ></Route>
          <Route exact path="/login" element={<Login setJwt={setJwt} jwt={jwt} />} ></Route>
          <Route path="*" element={<NotFound />}></Route>
        </Routes>
			</BrowserRouter>
    </>
  );
}

export default App;
