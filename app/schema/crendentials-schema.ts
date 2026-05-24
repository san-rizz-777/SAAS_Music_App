import {z} from "zod";

//email validation schema
export const emailSchema = z.email({message:"Email is invalid!!!"});

//password validation
export const passSchema = z.string({message:"Password is required!"})
                                    .min(8, {message:"Password must be at least 8 characters long!"})
                                    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
                                        {message:"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"});
