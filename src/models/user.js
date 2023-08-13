import { mongoose } from '../clients/database.js';
import FightSchema from './fight.js';

const Schema = mongoose.Schema;
const UserSchema = new Schema({
	username: String,
	points: { type: Number, default: 100 },
	hunts: { type: Number, default: 0 },
	fights: FightSchema.schema,
}, { timestamps: { createdAt: '_created', updatedAt: '_modified' } });

const User = mongoose.model('User', UserSchema);
export default User;
