import { mongoose } from '../clients/database.js';

const Schema = mongoose.Schema;
const FightSchema = new Schema({
	wins: { type: Number, default: 0 },
	losses: { type: Number, default: 0 },
	totalFightMinions: { type: Number, default: 0 },
	fightTaxPaid: { type: Number, default: 0 },
	fightMoneyWon: { type: Number, default: 0 },
	fightMoneyLost: { type: Number, default: 0 },
}, { timestamps: { createdAt: '_created', updatedAt: '_modified' } });

const Fight = mongoose.model('Fight', FightSchema);
export default Fight;
