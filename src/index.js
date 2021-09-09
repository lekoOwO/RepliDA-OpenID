const config = require('../data/config');

const fs = require("fs")
const ADMIN_FILE_PATH = 'data/admin.txt';
try {
    if (!fs.existsSync(ADMIN_FILE_PATH)) {
        fs.writeFileSync(ADMIN_FILE_PATH, '');
    }
  } catch(err) {
    console.error(err)
}
async function isAdmin(email){
    return new Promise((resolve, reject) => {
        fs.readFile(ADMIN_FILE_PATH, {encoding: "utf8"}, (err, data) => {
            if (err) return reject(err);

            return resolve(!!data.split("\n").find(x => x.trim() === email));
        })
    })
}

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
        const nonce = generators.nonce();
        req.session.nonce = nonce;
    
        const url = client.authorizationUrl({
            ...config.openIdMetadata,
            nonce,
        });
        res.redirect(url);
    })
    
    app.get("/callback", async(req, res) => {
        res.send(`
            <html>
                <head>
                    <script>
                        (async() => {
                            const resp = await fetch("/callback", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded"
                                },
                                body: window.location.hash.slice(1),
                                credentials: 'include'
                            });
                            const data = await resp.text();
                            document.write(data);
                        })();
                    </script>
            </html>
        `)
    })

    app.post("/callback", async(req, res) => {
        const nonce = req.session.nonce;
        const params = client.callbackParams(req);
        const tokenSet = await client.callback(config.openIdCallbackUri, params, { nonce })

        const {email, email_verified, name, picture, given_name} = tokenSet.claims()
        const data = {email, email_verified, name, picture, given_name};
        data.isAdmin = await isAdmin(email);

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
    })

    app.listen(config.port);
})();