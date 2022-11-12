import express from 'express';
import expressHandlebars from 'express-handlebars';

async function start() {
    const application = express();

    // Rendering
    application.engine('hbs', expressHandlebars.engine({
        defaultLayout: 'index.hbs',
        encoding: 'utf8',
        layoutsDir: 'rendering/layouts',
        partialsDir: 'rendering/partials',
        extname: '.hbs'
    }));

    application.set('view engine', 'hbs');
    application.set('views', "C:/Users/Jeremy/Storage/Programming/Web/Workspace/velocity/rendering/views/");

    // Middleware
    application.use(express.static('public'));

    // Routing
    application.get('/', (request, response) => {
        response.locals.scripts = [{ src: '/scripts/race.js', type: 'module' }];
        response.locals.links = [{ href: 'styles/main.css', rel: 'stylesheet' }];
        response.render('home');
    });

    application.listen(80, () => {
        console.log(`Server now listening at http://localhost.`);
    })
}

start();