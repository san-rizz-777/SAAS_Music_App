"use client";  //only renders on the client

import {signIn, signOut, useSession} from "next-auth/react"

export function Appbar()
{
 const session = useSession();    //to track the session of user
    return(
        <div>
            <div className="flex justify-between items-center">
                <div>
                    NachKlang
                </div>
              <div>
                  {session.data?.user && <button className="m-2 p-2 bg-blue-700"  onClick={() => signOut()}>Logout</button>}
                  {!session.data?.user && <button className="m-2 p-2 bg-amber-700" onClick={() => signIn()}>SignIn</button>}
              </div>
            </div>
         </div>
    )
}
