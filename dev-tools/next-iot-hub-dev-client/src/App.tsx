import React from 'react';
import { supabase } from './subabase';
import { Profile } from './profile';
import Auth from './auth';
import type { User } from '@supabase/supabase-js';

// import { Admin, Resource } from 'react-admin';
// import { UserList } from './users';
// import jsonServerProvider from 'ra-data-json-server';
// import { PostList } from './posts';
// import Dashboard from './dashboard';
// import authProvider from './authProvider';

// const dataProvider = jsonServerProvider('https://jsonplaceholder.typicode.com');

interface AppProps {}

function App({}: AppProps) {
  const [user, setUser] = React.useState<User | null>(null);
  React.useEffect(() => {
    const session = supabase.auth.session();
    setUser(session?.user ?? null);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user;

        setUser(currentUser ?? null);
      },
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, [user]);
  // Create the count state.
  return (
    <>
      {' '}
      <div className="flex items-center justify-center min-w-full min-h-screen bg-gray-50">
        {!user ? (
          <Auth
            setUserOnClick={() => {
              const session = supabase.auth.session();
              console.log(session);
              setUser(session?.user ?? null);
            }}
          />
        ) : (
          <Profile
            user={user}
            logoutHandler={() => {
              supabase.auth
                .signOut()
                .then((res) => {
                  setUser(null);
                })
                .catch((err) => {
                  console.error(err);
                });
              console.log('clicked logout');
            }}
          />
        )}
      </div>
    </>
  );
}

export default App;
