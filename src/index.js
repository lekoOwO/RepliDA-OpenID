const config = require('../data/config');

const express = require('express');
const app = express();

const session = require('express-session')
const FileStore = require('session-file-store')(session)
const sessionConfig = {
    name: "RepliDA-OpenID",
    store: new FileStore({}),
    secret: config.sessionSecret,
    resave: true,
    saveUninitialized: false,
    cookie: {
        httpOnly: true
    }
}

const sessionMiddleware = session(sessionConfig);
app.use(sessionMiddleware);

app.use(express.json());
app.use(express.urlencoded());

const jwt = require('jsonwebtoken');

(async() => {
    const { Issuer, generators } = require('openid-client');
    const issuer = await Issuer.discover(config.openidIssuer);
    const client = new issuer.Client(config.openIdMetadata);

    app.get("/login", async(req, res) => {
        const codeVerifier = generators.codeVerifier();
        req.session.codeVerifier = codeVerifier;

        const codeChallenge = generators.codeChallenge(codeVerifier);
    
        const url = client.authorizationUrl({
            scope: config.openIdScope,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });
        res.redirect(url);
    })

    app.get("/callback", async(req, res) => {
        try {
            const params = client.callbackParams(req);

            const tokenSet = await client.oauthCallback(config.openIdMetadata.redirect_uri, params, { code_verifier: req.session.codeVerifier })

            const {email, uid, chinese_name: name, picture, groups} = tokenSet.claims()
            const data = {email, uid, name, picture, groups};
            data.isAdmin = data.groups.includes(config.adminGroup);

            const token = jwt.sign(data, config.jwtSecret, { expiresIn: 20 });
        
            res.send(`
            <html>
                <head>
                    <script>
                        window.location.href = "${config.target}?token=" + encodeURIComponent('${token}');
                    </script>
                </head>
            </html>
            `)
        } catch (e) {
            res.sendStatus(500);
        }
    })

    app.listen(config.port);
})();