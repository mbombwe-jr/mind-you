import React from 'react';

const Home = () => (
  <div className="flex flex-1 items-center justify-center p-10">
    <div className="max-w-xl text-center">
      <h1 className="text-5xl font-bold mb-4">Welcome Home</h1>
      <p className="text-lg text-muted-foreground mb-6">You are on the Home page. Use the sidebar to switch to Chat or other sections.</p>
      {/* Add Home dashboard widgets or quick links here */}
    </div>
  </div>
);

export default Home;
