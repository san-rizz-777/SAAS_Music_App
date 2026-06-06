import NextAuth from "next-auth";
import {authOptions} from "@/lib/next-options"

// A simple handler to after authentication
const handler = NextAuth(authOptions);

export {handler as GET, handler as POST}