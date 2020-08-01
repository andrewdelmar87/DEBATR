import React from 'react';
import './App.css';
import VideoChat from './VideoChat';
import ReactDOM from 'react-dom';
import Stage from './components/stage/stage';
import NavBar from './components/nav/nav'
import SignUp from './components/sign-up/signUp'
import PostDebateReview from './components/post-debate/postDebate'
import SignIn from './components/sign-up/signIn'
        
import Lobby from './components/lobby/lobby'
// import UserRating from './components/partials/staticRating'
import UserRating from './components/partials/controlledRating'
import DiscreteSlider from './components/partials/slider'
import UserCard from './components/user-card/userCard'



import './components/partials/slider.css'

{/* <VideoChat /> */}

const App = () => {
  return (
    <div className="app">
        <NavBar />
      <main>
        <PostDebateReview />
        <br />
        <br />
        <br />
        <Stage />
        <br />
        <br />
        <br />
        <SignUp />
        <br />
        <br />
        <br />
        <SignIn />
        <br />
        <br />
        <br />
        <UserCard />
        <br />
        <br />
        <br />
        <Lobby />
      </main>
      <footer>
        <p>
          Made with{' '}
          <span role="img" aria-label="React">
            ⚛️
          </span>{' '}
          by <p>AAA+</p>
        </p>
      </footer>
    </div>
  );
};

export default App;
