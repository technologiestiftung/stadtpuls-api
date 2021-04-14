import type { User } from '@supabase/gotrue-js';
import React from 'react';
import { supabase } from './subabase';
export function Profile({
  user,
  logoutHandler,
}: {
  user: User;

  logoutHandler: (e: React.ChangeEvent<any>) => void;
}) {
  const [apiResponse, setApiResponse] = React.useState<string | undefined>();
  const thClasses = 'text-left pl-1 pr-3';
  const trClasses = 'cursor-default text-m w-1/2';
  return (
    <div className="flex flex-col w-full h-full max-w-xl p-5 text-base bg-white shadow sm:h-auto sm:w-2/5">
      <h2 className="pb-2 mb-1 font-sans text-4xl text-center border-b max-4 align-center">
        Profile
      </h2>
      <table className="table-auto">
        <tbody>
          <tr className={trClasses}>
            <th className={thClasses}>Email:</th>
            <td>{user.email}</td>
          </tr>
          <tr className={trClasses}>
            <th className={thClasses}>Role:</th>
            <td>{user.role}</td>
          </tr>
          <tr className={trClasses}>
            <th className={thClasses}>Created At:</th>
            <td>{user.created_at}</td>
          </tr>

          <tr className={trClasses}>
            <th
              className={`text-blue-600 transition duration-150 ease-in-out  hover:text-blue-900 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue ${thClasses}`}
              onClick={() => {
                const session = supabase.auth.session();
                if (!session)
                  throw new Error('Could not get superbase session');
                fetch('http://localhost:8888/protected', {
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                  },
                })
                  .then((response) => {
                    if (!response.ok) {
                      throw new Error('Response not okay from api');
                    }
                    return response.json();
                  })
                  .then((json) => {
                    console.log(json);
                    setApiResponse(JSON.stringify(json));
                    setTimeout(() => {
                      setApiResponse('do it again!');
                    }, 5000);
                  })
                  .catch(console.error);
              }}
            >
              Make Berlin-API Request:
            </th>
            <td>{apiResponse ? apiResponse : 'nothing yet'}</td>
          </tr>
        </tbody>
      </table>
      <div className="flex mt-10">
        <span className="block mx-1.5 w-full rounded-md shadow-sm">
          <button
            onClick={logoutHandler}
            type="button"
            className="flex justify-center w-full px-4 py-2 text-sm font-medium text-blue-600 transition duration-150 ease-in-out border border-blue-600 rounded-md hover:bg-blue-600 hover:text-white focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700"
          >
            Logout
          </button>
        </span>
      </div>
    </div>
  );
}
