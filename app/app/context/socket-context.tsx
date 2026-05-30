import {useSession} from "next-auth/react"
import {Dispatch, PropsWithChildren, SetStateAction, useState, useEffect, useContext, createContext} from "react";

//creating the socket context type
type SocketContextType = {
    socket: null | WebSocket;
    user: null | {id: string, token?: string};
    setUser: Dispatch<SetStateAction<{id: string, token?: string} | null>>;
    connectionError: boolean;
    loading: boolean;
}

//creating a context
const SocketContext = createContext<SocketContextType>({
    socket: null,
    user: null,
    setUser: () => {},
    connectionError: false,
    loading: true
});

export const SocketContextProvider = ({ children }: PropsWithChildren) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [user, setUser] = useState<{id: string, token?: string} | null>(null);
    const [connectionError, setConnectionError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    ///create a instance of session
    const session = useSession();

    useEffect(() => {
        if(session && session.data?.user.id){
const ws = new WebSocket(process.env.NEXT_PUBLIC_WSS_URL as string);

///open function
ws.onopen = () => {
    setSocket(ws);
    setUser(session.data?.user || null);
    setLoading(false);
};

//close function
ws.onclose = () => {
    setSocket(null);
    setLoading(false);
};

//when error happened
ws.onerror = () => {
    setConnectionError(true);
    setSocket(null);
    setLoading(false);
};
        }
    }, [socket, session.data]);


    return <SocketContext.Provider value={{socket, user, connectionError, loading, setUser}}>{children}</SocketContext.Provider>
};


///use socket function custom hook
export const useSocket = () => {

 const {socket, user, setUser, connectionError, loading} =  useContext(SocketContext);

 const sendMessage = (type: string, data: {[key: string] : any}) => {

     ///serializing the json
     socket?.send(JSON.stringify({type, data: {...data,
          token: user?.token} }));
 }

 return {socket, user , setUser, connectionError, loading, sendMessage};
};




