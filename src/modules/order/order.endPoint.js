import { roles } from "../../middleware/auth.js";

export const endPoint ={
    create :[roles.User],
    cancel:[roles.User],
    update:[roles.Inspector],
    getAll:[roles.Inspector],
    getMyTickets:[roles.User],
}