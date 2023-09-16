module.exports = {
    "openidIssuer": "https://accounts.google.com", // Using google as example
    "openIdMetadata": {
        client_id: '8xxxxx74xxx3-exxu4rhnxxxxxxxxxxxmoisxxxxxs3x6.apps.googleusercontent.com',
        redirect_uri: 'http://localhost:3011/callback', // This program's baseURL + /callback, make sure it's accessable by client user.
        response_types: ['id_token'], // Using implicit flow
        scope: "openid email profile"
    },
    "openIdCallbackUri": "https://oauth2.googleapis.com/token", // Using google as example
    "target": "REPLIDA_LOGIN_PATH", // RepliDA's login path
    "sessionSecret": "YOUR_SESSION_SECRET",
    "jwtSecret": "THE_JWT_SECRET", // Should be the same as RepliDA's config.callbackJwtSecret
    "port": 3011,
    "adminGroup": "pcta"
}