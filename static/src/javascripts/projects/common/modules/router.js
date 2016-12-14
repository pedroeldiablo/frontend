// Client-side routing module
// Heavily inspired by https://github.com/PaulKinlan/leviroutes/blob/master/routes.js
function Router() {
    let routes = [];

    let matchRoute = url => {
        let i;
        let routeExec;
        let routeMatch;
        let params;
        let g;
        let group;
        let route = null;
        /* eslint-disable no-cond-assign*/
        for (i = 0; route = routes[i]; i++) {
            /* eslint-enable no-cond-assign*/

            routeExec = route.regex.regexp.exec(url);
            routeMatch = (routeExec) ? true : false;

            if (routeMatch) {
                params = {};
                for (g in route.regex.groups) {
                    group = route.regex.groups[g];
                    params[g] = routeExec[group + 1];
                }

                route.callback({
                    url,
                    params,
                });
                return true;
            }
        }

        return false;
    };

    this.parseRoute = function (path) {
        this.parseGroups = loc => {
            let nameRegexp = new RegExp(':([^/.\\\\]+)', 'g');
            let newRegexp = `${loc}`;
            let groups = {};
            let matches = null;
            let i = 0;

            // Find the places to edit.
            /* eslint-disable no-cond-assign*/
            while (matches = nameRegexp.exec(loc)) {
                /* eslint-enable no-cond-assign*/
                groups[matches[1]] = i++;
                newRegexp = newRegexp.replace(matches[0], '([^/.\\\\]+)');
            }

            newRegexp += '$'; // Only do a full string match

            return {
                groups,
                regexp: new RegExp(newRegexp),
            };
        };

        return this.parseGroups(path);
    };

    this.get = function (route, callback) {
        routes.push({
            regex: this.parseRoute(route),
            callback,
        });
    };

    this.getRoutes = () => routes;

    this.init = () => {
        matchRoute(window.location.pathname);
    };
}

export default Router;
