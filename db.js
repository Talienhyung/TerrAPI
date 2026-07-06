const dotenv = require('dotenv');
dotenv.config({ quiet: true });
const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false });

class Measure extends Model { }
Measure.init(
    {
        temperature: {
            type: DataTypes.FLOAT,
        },
        humidity: {
            type: DataTypes.FLOAT,
        },
        timestamp: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
        },
        receivedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        // Other model options go here
        sequelize, // We need to pass the connection instance
        modelName: 'Measure', // We need to choose the model name
    },
);

// the defined model is the class itself
console.log(Measure === sequelize.models.Measure); // true

module.exports = { sequelize, Measure };