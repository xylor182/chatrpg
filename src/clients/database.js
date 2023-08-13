import mongoose from 'mongoose';

import { secrets } from "../configs/index.js";
const { user, password, ip, database } = secrets.database;

mongoose.set('debug', false);
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('runValidators', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

let dbConnection = null;
dbConnection = async () => await mongoose.connect(`mongodb+srv://${user}:${password}@${ip}/${database}?retryWrites=true&w=majority`);

export { mongoose };
export default dbConnection;