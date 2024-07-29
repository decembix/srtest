const jwt = require('jsonwebtoken');
const secret = 'mysecret'; // 실제로는 환경변수로 설정해야 하는데 뭔 .env어쩌고기억이안나서안건들엿음

module.exports = function (req, res, next) {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};