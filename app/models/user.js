const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const jwt = require('jsonwebtoken');

const userSchema = new Schema({
    username: String,
    password: String,
    email: { type: String, unique: true, required: true },
    invalidTokens: [{ type: String }],
});

userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, 'your-secret-key');
    return token;
};

userSchema.methods.invalidateAuthToken = function (token) {
    this.invalidTokens.push(token);
    return this.save();
};

userSchema.methods.isAuthTokenValid = function (token) {
    return !this.invalidTokens.includes(token);
};

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

module.exports = User;
